import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { startOfWeek, endOfWeek, subWeeks } from "date-fns";

// POST /api/weekly-reports/generate — 生成某学生本周周报
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const { studentId } = body;
    if (!studentId) {
      return NextResponse.json({ error: "缺少学生ID" }, { status: 400 });
    }

    // 本周时间范围
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    // 上周时间范围（用于对比）
    const lastWeekStart = subWeeks(weekStart, 1);
    const lastWeekEnd = subWeeks(weekEnd, 1);

    // 获取本周数据
    const [courses, records, mistakes, scores] = await Promise.all([
      prisma.course.findMany({
        where: {
          studentId,
          startTime: { gte: weekStart, lte: weekEnd },
          status: "completed",
        },
      }),
      prisma.dailyRecord.findMany({
        where: {
          studentId,
          date: { gte: weekStart, lte: weekEnd },
        },
        orderBy: { date: "asc" },
      }),
      prisma.mistakeRecord.findMany({
        where: {
          studentId,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.examScore.findMany({
        where: { studentId },
        orderBy: { examDate: "desc" },
        take: 5,
      }),
    ]);

    // 计算统计数据
    const totalCourses = courses.length;
    const totalHours = courses.reduce((sum, c) => sum + c.duration, 0);

    const avgMastery =
      records.length > 0
        ? Math.round(
            (records.reduce((sum, r) => sum + r.masteryLevel, 0) /
              records.length) *
              10
          ) / 10
        : 0;

    const newMistakes = mistakes.length;
    const mistakeByType = {
      careless: mistakes.filter((m) => m.errorType === "careless").length,
      concept: mistakes.filter((m) => m.errorType === "concept").length,
      approach: mistakes.filter((m) => m.errorType === "approach").length,
      unknown: mistakes.filter((m) => m.errorType === "unknown").length,
    };

    // 上周掌握度（对比用）
    const lastWeekRecords = await prisma.dailyRecord.findMany({
      where: {
        studentId,
        date: { gte: lastWeekStart, lte: lastWeekEnd },
      },
    });
    const lastWeekAvgMastery =
      lastWeekRecords.length > 0
        ? Math.round(
            (lastWeekRecords.reduce((sum, r) => sum + r.masteryLevel, 0) /
              lastWeekRecords.length) *
              10
          ) / 10
        : 0;

    // 生成自然语言总结
    const masteryTrend =
      avgMastery > lastWeekAvgMastery
        ? "上升"
        : avgMastery < lastWeekAvgMastery
        ? "下降"
        : "稳定";

    const summaryParts: string[] = [];
    summaryParts.push(
      `本周共完成 ${totalCourses} 节课（约 ${Math.round(totalHours / 60)} 小时）。`
    );
    if (records.length > 0) {
      summaryParts.push(
        `平均掌握度 ${avgMastery}/5 分，较上周（${lastWeekAvgMastery}）呈${masteryTrend}趋势。`
      );
    }
    if (newMistakes > 0) {
      summaryParts.push(`本周收录 ${newMistakes} 道错题。`);
      const topType = Object.entries(mistakeByType).sort(
        (a, b) => b[1] - a[1]
      )[0];
      if (topType && topType[1] > 0) {
        const typeLabels: Record<string, string> = {
          careless: "粗心大意",
          concept: "概念不清",
          approach: "思路不对",
          unknown: "完全不会",
        };
        summaryParts.push(`主要错因：${typeLabels[topType[0]]}（${topType[1]}题）。`);
      }
    }
    if (scores.length > 0) {
      summaryParts.push(`最近考试：${scores[0].examName} ${scores[0].score}/${scores[0].totalScore}。`);
    }

    const summary = summaryParts.join("");

    // 提取教师评语
    const teacherComments = records
      .filter((r) => r.teacherNotes)
      .map((r) => r.teacherNotes)
      .join("\n");

    // 保存周报到数据库
    const report = await prisma.learningReport.create({
      data: {
        studentId,
        reportType: "weekly",
        periodStart: weekStart,
        periodEnd: weekEnd,
        summary,
        scoreTrend: JSON.stringify({
          avgMastery,
          lastWeekAvgMastery,
          masteryTrend,
          totalCourses,
          totalHours: Math.round(totalHours / 60),
        }),
        mistakeAnalysis: JSON.stringify({
          total: newMistakes,
          byType: mistakeByType,
        }),
        nextPlan: body.nextPlan || "",
        renewalRecommendation: body.renewalRecommendation || "",
        status: "final",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            grade: { select: { name: true } },
          },
        },
      },
    });

    await logActivity({ action: "create", entity: "report", entityId: report.id, summary: `生成周报：${report.student?.name || ""}`, userId: session.user?.id });
    return NextResponse.json({
      data: {
        ...report,
        teacherComments,
        records,
        _summaryParts: summaryParts,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "生成周报失败", message: err.message },
      { status: 400 }
    );
  }
}

// GET /api/weekly-reports?studentId=xxx — 获取周报列表
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const limit = parseInt(searchParams.get("limit") || "10");

  const where: any = { reportType: "weekly" };
  if (studentId) where.studentId = studentId;

  const reports = await prisma.learningReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          grade: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({ data: reports });
}
