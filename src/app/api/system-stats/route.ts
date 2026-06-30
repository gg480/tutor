import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/system-stats — 全平台数据总览
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalStudents,
      activeStudents,
      totalCourses,
      completedCourses,
      totalRecords,
      totalMistakes,
      masteredMistakes,
      totalScores,
      totalRegistrations,
      activeRegistrations,
      totalAchievements,
      totalReports,
      // 本月新增
      studentsThisMonth,
      coursesThisMonth,
      recordsThisMonth,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: "active" } }),
      prisma.course.count(),
      prisma.course.count({ where: { status: "completed" } }),
      prisma.dailyRecord.count(),
      prisma.mistakeRecord.count(),
      prisma.mistakeRecord.count({ where: { status: "mastered" } }),
      prisma.examScore.count(),
      prisma.courseRegistration.count(),
      prisma.courseRegistration.count({ where: { status: "active" } }),
      prisma.achievement.count(),
      prisma.learningReport.count(),
      // 本月新增
      prisma.student.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.course.count({ where: { startTime: { gte: startOfMonth } } }),
      prisma.dailyRecord.count({ where: { date: { gte: startOfMonth } } }),
    ]);

    // 各学科统计
    const subjectStats = await prisma.course.groupBy({
      by: ["subject"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // 7日活跃度
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [weekCourses, weekRecords, weekMistakes] = await Promise.all([
      prisma.course.count({ where: { startTime: { gte: weekAgo } } }),
      prisma.dailyRecord.count({ where: { date: { gte: weekAgo } } }),
      prisma.mistakeRecord.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    return NextResponse.json({
      data: {
        totals: {
          students: totalStudents,
          activeStudents,
          courses: totalCourses,
          completedCourses,
          records: totalRecords,
          mistakes: totalMistakes,
          masteredMistakes,
          scores: totalScores,
          registrations: totalRegistrations,
          activeRegistrations,
          achievements: totalAchievements,
          reports: totalReports,
        },
        thisMonth: {
          newStudents: studentsThisMonth,
          newCourses: coursesThisMonth,
          newRecords: recordsThisMonth,
        },
        weekActivity: {
          courses: weekCourses,
          records: weekRecords,
          mistakes: weekMistakes,
        },
        subjectDistribution: subjectStats.map((s) => ({
          subject: s.subject,
          count: s._count.id,
        })),
        completionRate:
          totalCourses > 0
            ? Math.round((completedCourses / totalCourses) * 100)
            : 0,
        masteryRate:
          totalMistakes > 0
            ? Math.round((masteredMistakes / totalMistakes) * 100)
            : 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}
