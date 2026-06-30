import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

// GET /api/notifications — 获取通知汇总（今日待办）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 并行查询
    const [todayCourses, activeRegistrations, recentCourses, achievements] =
      await Promise.all([
        // 今日课程
        prisma.course.findMany({
          where: {
            startTime: { gte: todayStart, lte: todayEnd },
          },
          orderBy: { startTime: "asc" },
          include: {
            student: { select: { id: true, name: true, grade: true } },
          },
        }),

        // 剩余课时≤5的活跃课程包（续费预警）
        prisma.courseRegistration.findMany({
          where: {
            status: "active",
            remainingHours: { lte: 5 },
          },
          orderBy: { remainingHours: "asc" },
          include: {
            student: { select: { id: true, name: true, grade: true } },
          },
        }),

        // 已完成但未记录学情的课程（最近7天）
        prisma.course.findMany({
          where: {
            status: "completed",
            startTime: {
              gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
            dailyRecord: null,
          },
          orderBy: { startTime: "desc" },
          take: 10,
          include: {
            student: { select: { id: true, name: true, grade: true } },
          },
        }),

        // 近期竞赛成果
        prisma.achievement.findMany({
          orderBy: { awardDate: "desc" },
          take: 5,
          include: {
            student: { select: { id: true, name: true } },
          },
        }),
      ]);

    // 格式化今日课程时间
    const formattedCourses = todayCourses.map((c) => ({
      id: c.id,
      studentName: c.student.name,
      grade: c.student.grade,
      subject: c.subject,
      courseType: c.courseType,
      startTime: c.startTime.toISOString(),
      endTime: new Date(
        c.startTime.getTime() + c.duration * 60000
      ).toISOString(),
      status: c.status,
    }));

    // 格式化续费预警
    const renewAlerts = activeRegistrations.map((r) => ({
      id: r.id,
      studentName: r.student.name,
      grade: r.student.grade,
      packageName: r.packageName,
      remainingHours: r.remainingHours,
      usedPercent:
        r.totalHours > 0
          ? Math.round((r.usedHours / r.totalHours) * 100)
          : 0,
    }));

    // 格式化待记录学情
    const pendingRecords = recentCourses.map((c) => ({
      id: c.id,
      studentName: c.student.name,
      grade: c.student.grade,
      subject: c.subject,
      completedAt: c.startTime.toISOString(),
    }));

    return NextResponse.json({
      data: {
        todayCourses: {
          total: formattedCourses.length,
          items: formattedCourses,
          done: formattedCourses.filter((c) => c.status === "completed").length,
          pending: formattedCourses.filter((c) => c.status === "scheduled").length,
        },
        renewAlerts: {
          total: renewAlerts.length,
          items: renewAlerts,
        },
        pendingRecords: {
          total: pendingRecords.length,
          items: pendingRecords,
        },
        recentAchievements: achievements.map((a) => ({
          id: a.id,
          title: a.title,
          level: a.level,
          studentName: a.student.name,
          awardDate: a.awardDate.toISOString(),
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "获取通知失败" },
      { status: 500 }
    );
  }
}
