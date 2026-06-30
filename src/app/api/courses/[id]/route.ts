import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// PUT /api/courses/[id] — 更新课程（签到/完成/取消）
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const data: any = {};

    // 更新课程状态
    if (body.status) data.status = body.status;

    // 使用事务保证读状态+更新+扣课的原子性，防止并发重复扣课
    const course = await prisma.$transaction(async (tx) => {
      // 在事务内读取当前课程状态（行级锁保护）
      const before = await tx.course.findUnique({
        where: { id: params.id },
        select: { status: true, registrationId: true, studentId: true },
      });
      if (!before) {
        throw new Error("课程不存在");
      }

      const updated = await tx.course.update({
        where: { id: params.id },
        data,
        include: {
          student: { select: { id: true, name: true } },
        },
      });

      // 如果课程状态变为 completed，自动创建考勤记录
      if (body.status === "completed") {
        await tx.attendance.upsert({
          where: { courseId: params.id },
          update: { status: body.attendanceStatus || "present", checkInTime: new Date() },
          create: {
            courseId: params.id,
            studentId: updated.studentId,
            status: body.attendanceStatus || "present",
            checkInTime: new Date(),
          },
        });

        // 只在首次完成时扣减课时（在事务内，原子性保证）
        if (updated.registrationId && before.status !== "completed") {
          await tx.courseRegistration.update({
            where: { id: updated.registrationId },
            data: {
              usedHours: { increment: 1 },
              remainingHours: { decrement: 1 },
            },
          });
        }
      }

      return updated;
    });

    await logActivity({ action: "update", entity: "course", entityId: params.id, summary: `课程${body.status === "completed" ? "完成" : "更新"}：${course.student.name}`, userId: session.user?.id });

    return NextResponse.json({ data: course });
  } catch (err: any) {
    // 区分业务错误和系统错误
    if (err.message === "课程不存在") {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "更新失败", message: err.message },
      { status: 400 }
    );
  }
}

// DELETE /api/courses/[id]
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    await prisma.course.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "删除失败" }, { status: 400 });
  }
}
