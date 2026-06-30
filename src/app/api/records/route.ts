import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// GET /api/records — 获取学情记录
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: any = {};
  if (studentId) where.studentId = studentId;

  const [records, total] = await Promise.all([
    prisma.dailyRecord.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
      include: {
        student: { select: { id: true, name: true, grade: true } },
        course: { select: { id: true, subject: true } },
      },
    }),
    prisma.dailyRecord.count({ where }),
  ]);

  return NextResponse.json({ data: records, total });
}

// POST /api/records — 创建学情记录
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();

    // 如果指定了课程ID，检查是否已有记录
    if (body.courseId) {
      const existing = await prisma.dailyRecord.findUnique({
        where: { courseId: body.courseId },
      });
      if (existing) {
        return NextResponse.json(
          { error: "该课程已存在学情记录" },
          { status: 409 }
        );
      }
    }

    const record = await prisma.dailyRecord.create({
      data: {
        studentId: body.studentId,
        courseId: body.courseId || null,
        date: body.date ? new Date(body.date) : new Date(),
        teacherNotes: body.teacherNotes,
        knowledgePoints: body.knowledgePoints ? JSON.stringify(body.knowledgePoints) : null,
        masteryLevel: body.masteryLevel || 3,
        homeworkComplete: body.homeworkComplete,
        mood: body.mood || "normal",
        nextFocus: body.nextFocus,
        suggestions: body.suggestions,
      },
      include: { student: { select: { id: true, name: true } } },
    });

    await logActivity({ action: "create", entity: "record", entityId: record.id, summary: `学情记录：${record.student.name} 掌握度${body.masteryLevel}/5`, userId: session.user?.id });
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "创建记录失败", message: err.message },
      { status: 400 }
    );
  }
}
