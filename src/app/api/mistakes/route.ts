import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// GET /api/mistakes — 错题列表
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const status = searchParams.get("status");
  const errorType = searchParams.get("errorType");
  const limit = parseInt(searchParams.get("limit") || "100");

  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (status) where.status = status;
  if (errorType) where.errorType = errorType;

  const [mistakes, total] = await Promise.all([
    prisma.mistakeRecord.findMany({
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
        knowledgePoint: { select: { id: true, name: true, subject: true } },
      },
    }),
    prisma.mistakeRecord.count({ where }),
  ]);

  return NextResponse.json({ data: mistakes, total });
}

// POST /api/mistakes — 创建错题记录
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const mistake = await prisma.mistakeRecord.create({
      data: {
        studentId: body.studentId,
        courseId: body.courseId || null,
        imageUrl: body.imageUrl || null,
        subject: body.subject,
        errorType: body.errorType || "unknown",
        knowledgePointId: body.knowledgePointId || null,
        originalContent: body.originalContent,
        correctAnswer: body.correctAnswer,
        wrongAnswer: body.wrongAnswer,
        status: "unsolved",
      },
      include: { student: { select: { id: true, name: true } }, knowledgePoint: { select: { id: true, name: true } } },
    });

    await logActivity({ action: "create", entity: "mistake", entityId: mistake.id, summary: `录入错题：${mistake.student.name}`, userId: session.user?.id });
    return NextResponse.json({ data: mistake }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "创建错题记录失败", message: err.message },
      { status: 400 }
    );
  }
}
