import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// GET /api/scores — 获取成绩列表
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const where: any = {};
  if (studentId) where.studentId = studentId;

  const scores = await prisma.examScore.findMany({
    where,
    orderBy: { examDate: "desc" },
    include: {
      student: { select: { id: true, name: true, grade: true } },
    },
  });

  return NextResponse.json({ data: scores });
}

// POST /api/scores — 创建成绩记录
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const score = await prisma.examScore.create({
      data: {
        studentId: body.studentId, examName: body.examName, examDate: new Date(body.examDate),
        subject: body.subject, score: body.score, totalScore: body.totalScore || 100,
        ranking: body.ranking, classAverage: body.classAverage, examType: body.examType || "school",
        teacherAnalysis: body.teacherAnalysis, weaknessPoints: body.weaknessPoints ? JSON.stringify(body.weaknessPoints) : null,
      },
      include: { student: { select: { id: true, name: true } } },
    });

    const totalScore = body.totalScore || 100;
    await logActivity({ action: "create", entity: "score", entityId: score.id, summary: `录入成绩：${score.student.name} ${body.examName} ${body.score}/${totalScore}`, userId: session.user?.id });
    return NextResponse.json({ data: score }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "创建成绩记录失败", message: err.message },
      { status: 400 }
    );
  }
}
