import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// 学生列表/详情共用的关联查询字段
const STUDENT_INCLUDE = {
  school: { select: { name: true } },
  grade: { select: { name: true } },
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
} as const;

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
      include: STUDENT_INCLUDE,
    });

    if (!student) {
      return NextResponse.json({ error: "学生不存在" }, { status: 404 });
    }

    // 联表查询后扁平化 schoolName/gradeName 给前端使用
    const { school, grade, ...rest } = student;
    return NextResponse.json({
      data: {
        ...rest,
        schoolName: school?.name ?? null,
        gradeName: grade.name,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "获取学生信息失败", message },
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
    // school/grade/textbook 文本字段已移除，改为 schoolId/gradeId 外键
    const allowedFields = [
      "name", "gradeId", "schoolId",
      "parentGoal", "studentGoal",
      "currentScore",
      "personality", "weakness", "summary",
      "parentName", "parentPhone", "parentWechat",
      "status",
    ];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }
    // schoolId 允许置空（清空学校关联）
    if (body.schoolId === null) data.schoolId = null;

    const student = await prisma.student.update({
      where: { id: params.id },
      data,
      include: {
        school: { select: { name: true } },
        grade: { select: { name: true } },
      },
    });
    await logActivity({
      action: "update",
      entity: "student",
      entityId: student.id,
      summary: `更新学生信息：${student.name}`,
      userId: session.user?.id,
    });

    const { school, grade, ...rest } = student;
    return NextResponse.json({
      data: {
        ...rest,
        schoolName: school?.name ?? null,
        gradeName: grade.name,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "更新失败", message },
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
    const s = await prisma.student.findUnique({
      where: { id: params.id },
      select: { name: true },
    });
    await prisma.student.delete({ where: { id: params.id } });
    await logActivity({
      action: "delete",
      entity: "student",
      entityId: params.id,
      summary: `删除学生：${s?.name || "未知"}`,
      userId: session.user?.id,
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "删除失败", message },
      { status: 400 }
    );
  }
}
