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
          // 原子性检测并更新课程状态（updateMany 的 WHERE 条件本身即行级检测，
          // 只有 status="scheduled" 的记录才会被更新，并发时只会有一个请求成功）
          const updateResult = await tx.course.updateMany({
            where: { id: courseId, status: "scheduled" },
            data: { status: "completed" },
          });

          if (updateResult.count === 0) {
            // 判断是不存在还是已签到
            const existing = await tx.course.findUnique({
              where: { id: courseId },
              select: { id: true },
            });
            if (!existing) {
              throw new Error(`课程 ${courseId}: 不存在`);
            }
            throw new Error(`课程 ${courseId}: 已签到完成`);
          }

          // 查询课程详情（确定是本次请求完成的更新）
          const course = await tx.course.findUnique({
            where: { id: courseId },
            select: { studentId: true, registrationId: true },
          });

          // 创建考勤记录
          await tx.attendance.upsert({
            where: { courseId },
            update: { status: "present", checkInTime: new Date() },
            create: { courseId, studentId: course!.studentId, status: "present", checkInTime: new Date() },
          });

          // 自动扣课（原子性：只有当剩余课时 > 0 时才扣减，避免扣至负数）
          if (course!.registrationId) {
            const regResult = await tx.courseRegistration.updateMany({
              where: { id: course!.registrationId, remainingHours: { gt: 0 } },
              data: { usedHours: { increment: 1 }, remainingHours: { decrement: 1 } },
            });
            if (regResult.count === 0) {
              // 剩余课时为 0，回滚课程状态
              throw new Error(`课程 ${courseId}: 课时已用尽，无法签到`);
            }
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
