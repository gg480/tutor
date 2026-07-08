import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// POST /api/courses/batch — 批量创建课程
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const { studentId, subject, startDate, endDate, weekdays, time, duration, courseType, location } = body;

    if (!studentId || !subject || !startDate || !endDate || !weekdays?.length || !time) {
      return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
    }

    // 解析时间
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayMap: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };

    const created: any[] = [];
    const errors: string[] = [];

    // 整个循环在事务中执行，确保冲突检测和创建操作原子性，防止并发竞态
    await prisma.$transaction(async (tx) => {
      let current = new Date(start);

      while (current <= end) {
        const dayOfWeek = current.getDay(); // 0=Sun, 1=Mon, ...
        // weekdays: 1=Mon, 2=Tue, ..., 7=Sun
        const normalizedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

        if (weekdays.includes(normalizedDay)) {
          const startTime = new Date(current);
          startTime.setHours(hours, minutes, 0, 0);
          const endTime = new Date(startTime.getTime() + (duration || 120) * 60000);

          // 检查冲突（包含学生信息用于友好提示）
          const conflict = await tx.course.findFirst({
            where: {
              status: "scheduled",
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
            include: {
              student: { select: { name: true } },
            },
          });

          if (!conflict) {
            try {
              const course = await tx.course.create({
                data: {
                  studentId,
                  subject,
                  courseType: courseType || "normal",
                  startTime,
                  endTime,
                  duration: duration || 120,
                  location: location || null,
                  status: "scheduled",
                },
                include: { student: { select: { name: true } } },
              });
              created.push(course);
            } catch (err) {
              errors.push(`${current.toLocaleDateString("zh-CN")}: 创建失败`);
            }
          } else if (body.overwrite === true && body.conflictCourseIds?.includes(conflict.id)) {
            // 覆盖模式：用户确认覆盖此冲突课程
            try {
              await tx.course.delete({ where: { id: conflict.id } });
              const course = await tx.course.create({
                data: {
                  studentId,
                  subject,
                  courseType: courseType || "normal",
                  startTime,
                  endTime,
                  duration: duration || 120,
                  location: location || null,
                  status: "scheduled",
                },
                include: { student: { select: { name: true } } },
              });
              created.push(course);
            } catch (err) {
              errors.push(`${current.toLocaleDateString("zh-CN")}: 覆盖失败`);
            }
          } else {
            errors.push(`${current.toLocaleDateString("zh-CN")}: 与 ${conflict.student.name} 的课程冲突`);
          }
        }
        current.setDate(current.getDate() + 1);
      }
    });

    await logActivity({ action: "create", entity: "course", summary: `批量排课：成功${created.length}节，失败${errors.length}节`, userId: session.user?.id });
    return NextResponse.json({
      data: {
        created: created.length,
        failed: errors.length,
        courses: created,
        errors: errors.slice(0, 10),
      },
      message: `成功创建 ${created.length} 节课${errors.length > 0 ? `，${errors.length} 节失败` : ""}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "批量排课失败", message: err.message }, { status: 400 });
  }
}
