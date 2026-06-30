import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

// GET /api/semester-report?studentId=xxx&start=2026-01-01&end=2026-06-30
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!studentId) return NextResponse.json({ error: "缺少学生ID" }, { status: 400 });

  const startDate = start ? startOfDay(new Date(start)) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = end ? endOfDay(new Date(end)) : new Date();

  const [student, courses, records, mistakes, scores, achievements, weeklyReports, registrations] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { id: true, name: true, grade: true, school: true, summary: true, createdAt: true } }),
    prisma.course.findMany({ where: { studentId, startTime: { gte: startDate, lte: endDate } }, orderBy: { startTime: "asc" } }),
    prisma.dailyRecord.findMany({ where: { studentId, date: { gte: startDate, lte: endDate } }, orderBy: { date: "asc" } }),
    prisma.mistakeRecord.findMany({ where: { studentId, createdAt: { gte: startDate, lte: endDate } }, include: { knowledgePoint: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.examScore.findMany({ where: { studentId, examDate: { gte: startDate, lte: endDate } }, orderBy: { examDate: "asc" } }),
    prisma.achievement.findMany({ where: { studentId, awardDate: { gte: startDate, lte: endDate } }, orderBy: { awardDate: "desc" } }),
    prisma.learningReport.findMany({ where: { studentId, reportType: "weekly", createdAt: { gte: startDate, lte: endDate } }, orderBy: { createdAt: "desc" } }),
    prisma.courseRegistration.findMany({ where: { studentId } }),
  ]);

  // 计算统计
  const totalCourses = courses.length;
  const totalHours = Math.round(courses.reduce((s, c) => s + c.duration, 0) / 60);
  const completedCourses = courses.filter((c) => c.status === "completed").length;
  const completionRate = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  const totalRecords = records.length;
  const avgMastery = records.length > 0 ? Math.round((records.reduce((s, r) => s + r.masteryLevel, 0) / records.length) * 10) / 10 : 0;

  const totalMistakes = mistakes.length;
  const masteredMistakes = mistakes.filter((m) => m.status === "mastered").length;

  // 错因分布
  const mistakeByType = {
    careless: mistakes.filter((m) => m.errorType === "careless").length,
    concept: mistakes.filter((m) => m.errorType === "concept").length,
    approach: mistakes.filter((m) => m.errorType === "approach").length,
    unknown: mistakes.filter((m) => m.errorType === "unknown").length,
  };

  // 掌握度趋势（按月）
  const monthlyMastery: Record<string, number[]> = {};
  records.forEach((r) => {
    const month = new Date(r.date).toISOString().slice(0, 7);
    if (!monthlyMastery[month]) monthlyMastery[month] = [];
    monthlyMastery[month].push(r.masteryLevel);
  });
  const masteryTrend = Object.entries(monthlyMastery).map(([month, levels]) => ({
    month,
    avg: Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10,
    count: levels.length,
  })).sort((a, b) => a.month.localeCompare(b.month));

  // 每周课程数
  const weeklyCourseCount: Record<string, number> = {};
  courses.forEach((c) => {
    const week = new Date(c.startTime).toISOString().slice(0, 10);
    weeklyCourseCount[week] = (weeklyCourseCount[week] || 0) + 1;
  });

  return NextResponse.json({
    data: {
      student,
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      stats: {
        totalCourses, totalHours, completedCourses, completionRate,
        totalRecords, avgMastery, totalMistakes, masteredMistakes,
        totalScores: scores.length, totalAchievements: achievements.length,
        totalWeeks: weeklyReports.length,
        mistakeByType,
      },
      charts: { masteryTrend, weeklyCourseCount: Object.entries(weeklyCourseCount).slice(0, 20) },
      scores,
      achievements,
      recentWeeklyReports: weeklyReports.slice(0, 3),
      registration: registrations[0] || null,
      generatedAt: new Date().toISOString(),
    },
  });
}
