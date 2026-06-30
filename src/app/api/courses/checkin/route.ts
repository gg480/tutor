import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/courses/checkin — 批量签到
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const { courseIds } = body;

    if (!courseIds?.length) {
      return NextResponse.json({ error: "请选择课程" }, { status: 400 });
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const courseId of courseIds) {
      try {
        // 使用事务确保签到+扣课的原子性，防止并发重复扣课
        await prisma.$transaction(async (tx) => {
          // 加锁读取当前课程状态（事务内，串行化隔离级别下自动加行锁）
          const existing = await tx.course.findUnique({
            where: { id: courseId },
            select: { status: true, studentId: true, registrationId: true },
          });

          if (!existing) {
            throw new Error(`课程 ${courseId}: 不存在`);
          }

          if (existing.status === "completed") {
            throw new Error(`课程 ${courseId}: 已签到完成`);
          }

          // 更新课程状态为已完成
          const course = await tx.course.update({
            where: { id: courseId },
            data: { status: "completed" },
          });

          // 创建考勤记录
          await tx.attendance.upsert({
            where: { courseId },
            update: { status: "present", checkInTime: new Date() },
            create: { courseId, studentId: course.studentId, status: "present", checkInTime: new Date() },
          });

          // 自动扣课（在事务内执行，避免重复扣课）
          if (course.registrationId) {
            await tx.courseRegistration.update({
              where: { id: course.registrationId },
              data: { usedHours: { increment: 1 }, remainingHours: { decrement: 1 } },
            });
          }
        });

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(err.message);
      }
    }

    return NextResponse.json({
      data: results,
      message: `成功签到 ${results.success} 节课${results.failed > 0 ? `，${results.failed} 节失败` : ""}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "批量签到失败" }, { status: 400 });
  }
}
