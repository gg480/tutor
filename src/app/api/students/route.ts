import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// GET /api/students — 获取学生列表
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const grade = searchParams.get("grade");

  const where: any = {};
  if (status) where.status = status;
  if (grade) where.grade = grade;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { school: { contains: q } },
      { parentName: { contains: q } },
    ];
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      courses: {
        where: { status: "scheduled" },
        select: { id: true, startTime: true, subject: true },
      },
      courseRegistrations: {
        where: { status: "active" },
        select: { remainingHours: true, totalHours: true },
      },
    },
  });

  return NextResponse.json({
    data: students,
    total: students.length,
  });
}

// POST /api/students — 新建学生
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const student = await prisma.student.create({
      data: {
        name: body.name,
        grade: body.grade,
        school: body.school,
        parentGoal: body.parentGoal,
        studentGoal: body.studentGoal,
        textbook: body.textbook,
        currentScore: body.currentScore,
        personality: body.personality,
        weakness: body.weakness,
        summary: body.summary,
        parentName: body.parentName,
        parentPhone: body.parentPhone,
        parentWechat: body.parentWechat,
      },
    });

    // 记录操作日志
    await logActivity({
      action: "create",
      entity: "student",
      entityId: student.id,
      summary: `新建学生：${student.name}`,
      userId: session.user?.id,
    });

    return NextResponse.json({ data: student }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "创建失败", message: err.message },
      { status: 400 }
    );
  }
}
