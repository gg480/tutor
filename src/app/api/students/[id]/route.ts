import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// GET /api/students/[id] — 获取单个学生详情
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        diagnosticReports: { orderBy: { createdAt: "desc" }, take: 1 },
        learningPlans: { orderBy: { createdAt: "desc" }, take: 1 },
        courseRegistrations: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        courses: {
          orderBy: { startTime: "desc" },
          take: 20,
        },
        dailyRecords: {
          orderBy: { date: "desc" },
          take: 30,
        },
        mistakeRecords: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { knowledgePoint: true },
        },
        examScores: {
          orderBy: { examDate: "desc" },
          take: 20,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "学生不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: student });
  } catch (err: any) {
    return NextResponse.json(
      { error: "获取学生信息失败", message: err.message },
      { status: 500 }
    );
  }
}

// PUT /api/students/[id] — 更新学生信息
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    // 白名单方式显式提取允许更新的字段，防止数据注入
    const allowedFields = [
      "name", "grade", "school",
      "parentGoal", "studentGoal",
      "textbook", "currentScore",
      "personality", "weakness", "summary",
      "parentName", "parentPhone", "parentWechat",
      "status",
    ];
    const data: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }
    const student = await prisma.student.update({
      where: { id: params.id },
      data,
    });
    await logActivity({ action: "update", entity: "student", entityId: student.id, summary: `更新学生信息：${student.name}`, userId: session.user?.id });
    return NextResponse.json({ data: student });
  } catch (err: any) {
    return NextResponse.json(
      { error: "更新失败", message: err.message },
      { status: 400 }
    );
  }
}

// DELETE /api/students/[id] — 删除学生
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    // 先获取学生名用于日志
    const s = await prisma.student.findUnique({ where: { id: params.id }, select: { name: true } });
    await prisma.student.delete({ where: { id: params.id } });
    await logActivity({ action: "delete", entity: "student", entityId: params.id, summary: `删除学生：${s?.name || "未知"}`, userId: session.user?.id });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "删除失败", message: err.message },
      { status: 400 }
    );
  }
}
