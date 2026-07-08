import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// 将学生记录转换为前端使用的扁平结构（含 schoolName/gradeName）
type StudentWithRelations = {
  id: string;
  name: string;
  parentGoal: string | null;
  studentGoal: string | null;
  currentScore: string | null;
  personality: string | null;
  weakness: string | null;
  summary: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentWechat: string | null;
  schoolId: string | null;
  gradeId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  school: { name: string } | null;
  grade: { name: string };
  courses?: unknown;
  courseRegistrations?: unknown;
};

function mapStudent<T extends StudentWithRelations>(s: T) {
  return {
    id: s.id,
    name: s.name,
    parentGoal: s.parentGoal,
    studentGoal: s.studentGoal,
    currentScore: s.currentScore,
    personality: s.personality,
    weakness: s.weakness,
    summary: s.summary,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    parentWechat: s.parentWechat,
    schoolId: s.schoolId,
    gradeId: s.gradeId,
    schoolName: s.school?.name ?? null,
    gradeName: s.grade.name,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    courses: s.courses,
    courseRegistrations: s.courseRegistrations,
  };
}

// GET /api/students — 获取学生列表
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const gradeId = searchParams.get("gradeId");
    // 兼容旧前端按年级名筛选（Task 7 将改为 gradeId）
    const gradeName = searchParams.get("grade");

    const where: {
      status?: string;
      gradeId?: string;
      grade?: { name: string };
      OR?: Array<Record<string, unknown>>;
    } = {};
    if (status) where.status = status;
    if (gradeId) where.gradeId = gradeId;
    if (gradeName) where.grade = { name: gradeName };
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { school: { name: { contains: q } } },
        { parentName: { contains: q } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        school: { select: { name: true } },
        grade: { select: { name: true } },
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
      data: students.map(mapStudent),
      total: students.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "获取学生列表失败", message },
      { status: 500 }
    );
  }
}

// POST /api/students — 新建学生
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.name || !body.gradeId) {
      return NextResponse.json(
        { error: "请填写学生姓名和年级" },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        name: body.name,
        gradeId: body.gradeId,
        schoolId: body.schoolId || null,
        parentGoal: body.parentGoal,
        studentGoal: body.studentGoal,
        currentScore: body.currentScore,
        personality: body.personality,
        weakness: body.weakness,
        summary: body.summary,
        parentName: body.parentName,
        parentPhone: body.parentPhone,
        parentWechat: body.parentWechat,
      },
      include: {
        school: { select: { name: true } },
        grade: { select: { name: true } },
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

    return NextResponse.json({ data: mapStudent(student) }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "创建失败", message },
      { status: 400 }
    );
  }
}
