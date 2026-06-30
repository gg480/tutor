import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfDay, endOfDay, subDays } from "date-fns";

// GET /api/dashboard — 工作台聚合数据（一次请求替代多次）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const now = new Date();

    // 并行查询所有统计数据
    const [
      activeStudents,
      todayCourses,
      mistakes,
      records,
      weeklyReports,
      scores,
    ] = await Promise.all([
      // 在读学生数
      prisma.student.count({ where: { status: "active" } }),
      // 今日课程
      prisma.course.count({
        where: {
          startTime: { gte: startOfDay(now), lte: endOfDay(now) },
        },
      }),
      // 错题统计
      prisma.mistakeRecord.findMany({
        select: { status: true },
      }),
      // 近期学情记录（最近30天）
      prisma.dailyRecord.findMany({
        where: { date: { gte: subDays(now, 30) } },
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          masteryLevel: true,
          student: { select: { id: true, name: true } },
        },
      }),
      // 周报数
      prisma.learningReport.count({ where: { reportType: "weekly" } }),
      // 近期成绩
      prisma.examScore.findMany({
        orderBy: { examDate: "desc" },
        take: 10,
        select: {
          id: true,
          examName: true,
          examDate: true,
          score: true,
          totalScore: true,
          student: { select: { id: true, name: true } },
        },
      }),
    ]);

    // 计算待处理错题
    const pendingMistakes = mistakes.filter(
      (m) => m.status !== "mastered"
    ).length;
    const totalMistakes = mistakes.length;

    // 掌握度分布
    const masteryDistribution = [0, 0, 0, 0, 0];
    records.forEach((r) => {
      if (r.masteryLevel >= 1 && r.masteryLevel <= 5) {
        masteryDistribution[r.masteryLevel - 1]++;
      }
    });

    // 最近30天掌握度趋势（按天聚合）
    const masteryByDate = new Map<string, number[]>();
    records.forEach((r) => {
      const dateKey = new Date(r.date).toISOString().slice(0, 10);
      if (!masteryByDate.has(dateKey)) masteryByDate.set(dateKey, []);
      masteryByDate.get(dateKey)!.push(r.masteryLevel);
    });

    const masteryTrend = Array.from(masteryByDate.entries())
      .map(([date, levels]) => ({
        date,
        avgMastery: Math.round(
          (levels.reduce((a, b) => a + b, 0) / levels.length) * 10
        ) / 10,
        count: levels.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // 最近14天

    // 最近活动
    const recentActivity = [
      ...records.slice(0, 5).map((r) => ({
        type: "record" as const,
        text: `${r.student?.name || "学生"} 学情记录`,
        date: r.date.toISOString(),
        detail: `掌握度 ${r.masteryLevel}/5`,
      })),
    ];

    return NextResponse.json({
      data: {
        stats: {
          activeStudents,
          todayCourses,
          pendingMistakes,
          totalMistakes,
          totalRecords: records.length,
          weeklyReports,
          totalScores: scores.length,
        },
        charts: {
          masteryTrend,
          masteryDistribution,
          recentScores: scores,
        },
        recentActivity,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "获取Dashboard数据失败" },
      { status: 500 }
    );
  }
}
