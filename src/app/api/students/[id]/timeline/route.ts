import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/students/[id]/timeline — 获取学生的时间线事件
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const studentId = params.id;

  // 并行查询所有事件数据
  const [
    student,
    diagnosticReports,
    learningPlans,
    courses,
    records,
    mistakes,
    scores,
    achievements,
    weeklyReports,
  ] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, grade: true, createdAt: true, summary: true },
    }),
    prisma.diagnosticReport.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.learningPlan.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      where: { studentId, status: "completed" },
      orderBy: { startTime: "desc" },
    }),
    prisma.dailyRecord.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
    }),
    prisma.mistakeRecord.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: { knowledgePoint: { select: { name: true } } },
    }),
    prisma.examScore.findMany({
      where: { studentId },
      orderBy: { examDate: "desc" },
    }),
    prisma.achievement.findMany({
      where: { studentId },
      orderBy: { awardDate: "desc" },
    }),
    prisma.learningReport.findMany({
      where: { studentId, reportType: "weekly" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // 构建时间线事件
  const events: any[] = [];

  // 建档事件
  if (student) {
    events.push({
      id: "created",
      type: "milestone",
      title: "学生建档",
      description: `${student.name} 加入拾步工作室`,
      date: student.createdAt.toISOString(),
      details: student.summary ? `入学概况：${student.summary}` : "",
      icon: "🎉",
    });
  }

  // 诊断报告事件
  diagnosticReports.forEach((r) => {
    events.push({
      id: `diag_${r.id}`,
      type: "assessment",
      title: "学情诊断",
      description: r.conclusion?.slice(0, 80) || "完成学情诊断",
      date: r.createdAt.toISOString(),
      details: r.recommendations || "",
      icon: "📋",
    });
  });

  // 学习计划事件
  learningPlans.forEach((p) => {
    events.push({
      id: `plan_${p.id}`,
      type: "plan",
      title: `制定计划：${p.planName}`,
      description: `校内同步 ${p.schoolRatio}% · 竞赛拓展 ${p.examRatio}%`,
      date: p.createdAt.toISOString(),
      details: p.notes || "",
      icon: "🎯",
    });
  });

  // 课程完成事件（按天聚合）
  const courseMap = new Map<string, number>();
  courses.forEach((c) => {
    const day = new Date(c.startTime).toISOString().slice(0, 10);
    courseMap.set(day, (courseMap.get(day) || 0) + 1);
  });
  courseMap.forEach((count, day) => {
    events.push({
      id: `courses_${day}`,
      type: "course",
      title: `完成 ${count} 节课`,
      description: `${day}`,
      date: new Date(day).toISOString(),
      details: "",
      icon: "📚",
    });
  });

  // 学情记录事件
  records.forEach((r) => {
    const emoji = r.masteryLevel >= 4 ? "🌟" : r.masteryLevel >= 3 ? "📗" : "📕";
    events.push({
      id: `record_${r.id}`,
      type: "record",
      title: `学情记录 · 掌握度 ${r.masteryLevel}/5`,
      description: r.teacherNotes?.slice(0, 60) || "",
      date: r.date.toISOString(),
      details: r.nextFocus ? `下节课重点：${r.nextFocus}` : "",
      icon: emoji,
    });
  });

  // 错题事件
  mistakes.forEach((m) => {
    const STATUS_LABEL: Record<string, string> = {
      unsolved: "待解决", in_progress: "巩固中", mastered: "已掌握",
    };
    events.push({
      id: `mistake_${m.id}`,
      type: "mistake",
      title: `录入错题 · ${STATUS_LABEL[m.status] || ""}`,
      description: m.originalContent?.slice(0, 50) || "",
      date: m.createdAt.toISOString(),
      details: m.knowledgePoint ? `知识点：${m.knowledgePoint.name}` : "",
      icon: m.status === "mastered" ? "✅" : "📸",
    });
  });

  // 成绩事件
  scores.forEach((s) => {
    const pct = s.score / s.totalScore;
    const emoji = pct >= 0.85 ? "🌟" : pct >= 0.6 ? "📊" : "💪";
    events.push({
      id: `score_${s.id}`,
      type: "score",
      title: `${s.examName} · ${s.score}/${s.totalScore}`,
      description: `${s.subject}`,
      date: s.examDate.toISOString(),
      details: s.teacherAnalysis || "",
      icon: emoji,
    });
  });

  // 竞赛成果事件
  achievements.forEach((a) => {
    events.push({
      id: `achievement_${a.id}`,
      type: "achievement",
      title: a.title,
      description: a.organization || "",
      date: a.awardDate.toISOString(),
      details: a.description || "",
      icon: "🏆",
    });
  });

  // 周报事件
  weeklyReports.forEach((r) => {
    events.push({
      id: `weekly_${r.id}`,
      type: "report",
      title: "生成周报",
      description: r.summary?.slice(0, 60) || "",
      date: r.createdAt.toISOString(),
      details: "",
      icon: "📬",
    });
  });

  // 按时间排序（最新在前）
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 计算统计数据
  const stats = {
    totalEvents: events.length,
    totalCourses: courses.length,
    totalRecords: records.length,
    totalMistakes: mistakes.length,
    totalScores: scores.length,
    totalAchievements: achievements.length,
    averageMastery:
      records.length > 0
        ? Math.round(
            (records.reduce((s, r) => s + r.masteryLevel, 0) / records.length) * 10
          ) / 10
        : 0,
    daysSinceCreated: student
      ? Math.ceil(
          (Date.now() - new Date(student.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0,
  };

  return NextResponse.json({ data: { student, events, stats } });
}
