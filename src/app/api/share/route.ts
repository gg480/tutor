import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/share — 生成学生分享链接
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "缺少学生ID" }, { status: 400 });
    }

    // 生成一个简单token：base64(学生ID+日期+随机数)
    const random = Math.random().toString(36).slice(2, 8);
    const token = Buffer.from(`${studentId}:${Date.now()}:${random}`).toString("base64url");

    const shareUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/parent/${token}`;

    return NextResponse.json({
      data: {
        token,
        shareUrl,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天有效
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "生成分享链接失败" }, { status: 500 });
  }
}

// GET /api/share?token=xxx — 通过token获取学生数据（公开接口，无需登录）
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "缺少token" }, { status: 400 });
  }

  try {
    // 解析token
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [studentId] = decoded.split(":");

    if (!studentId) {
      return NextResponse.json({ error: "无效的分享链接" }, { status: 400 });
    }

    // 获取学生数据
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        grade: true,
        school: true,
        parentName: true,
        summary: true,
        createdAt: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "学生不存在" }, { status: 404 });
    }

    // 并行获取统计数据
    const [records, mistakes, scores, weeklyReports] = await Promise.all([
      prisma.dailyRecord.findMany({
        where: { studentId },
        orderBy: { date: "desc" },
        take: 20,
        select: { id: true, date: true, masteryLevel: true, teacherNotes: true, mood: true },
      }),
      prisma.mistakeRecord.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, errorType: true, status: true, subject: true, originalContent: true, correctCount: true, createdAt: true },
      }),
      prisma.examScore.findMany({
        where: { studentId },
        orderBy: { examDate: "desc" },
        take: 10,
        select: { id: true, examName: true, examDate: true, subject: true, score: true, totalScore: true, examType: true },
      }),
      prisma.learningReport.findMany({
        where: { studentId, reportType: "weekly" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, summary: true, periodStart: true, periodEnd: true, createdAt: true, scoreTrend: true, mistakeAnalysis: true },
      }),
    ]);

    // 计算统计数据
    const totalRecords = records.length;
    const avgMastery = records.length > 0
      ? Math.round((records.reduce((s, r) => s + r.masteryLevel, 0) / records.length) * 10) / 10
      : 0;

    const masteredCount = mistakes.filter(m => m.status === "mastered").length;
    const totalMistakes = mistakes.length;

    // 掌握度趋势（按天）
    const trendMap = new Map<string, number[]>();
    records.forEach(r => {
      const key = new Date(r.date).toISOString().slice(0, 10);
      if (!trendMap.has(key)) trendMap.set(key, []);
      trendMap.get(key)!.push(r.masteryLevel);
    });
    const masteryTrend = Array.from(trendMap.entries())
      .map(([date, levels]) => ({
        date,
        avg: Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    return NextResponse.json({
      data: {
        student,
        stats: { totalRecords, avgMastery, totalMistakes, masteredMistakes: masteredCount, totalExams: scores.length },
        charts: { masteryTrend },
        records,
        mistakes,
        scores,
        weeklyReports,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "数据加载失败" }, { status: 500 });
  }
}
