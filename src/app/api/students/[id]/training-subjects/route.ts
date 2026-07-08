import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { Prisma } from "@prisma/client";
import {
  validateTrainingSubjectInput,
  buildTrainingSubjectData,
  mapTrainingSubjectRecord,
} from "@/lib/training-subject-validation";

// GET /api/students/[id]/training-subjects — 获取学生培训学科列表
// 按 startDate DESC 排序，联表查询 Subject.name 后内存合并 subjectName
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const records = await prisma.studentTrainingSubject.findMany({
      where: { studentId: params.id },
      orderBy: { startDate: "desc" },
    });

    // StudentTrainingSubject 无 subject 关系字段，需单独查询学科名后内存合并
    const subjectIds = [...new Set(records.map((r) => r.subjectId))];
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    });
    const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

    return NextResponse.json({
      data: records.map((r) =>
        mapTrainingSubjectRecord(r, subjectMap.get(r.subjectId) ?? null)
      ),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "获取培训学科列表失败", message },
      { status: 500 }
    );
  }
}

// POST /api/students/[id]/training-subjects — 新增培训学科
// 同一学生同学科不重复（依赖 @@unique 约束，违反返回 409）
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const error = validateTrainingSubjectInput(body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const record = await prisma.studentTrainingSubject.create({
      data: buildTrainingSubjectData(body, params.id),
    });

    // 查询学科名称（StudentTrainingSubject 无 subject 关系字段）
    const subject = await prisma.subject.findUnique({
      where: { id: record.subjectId },
      select: { name: true },
    });

    await logActivity({
      action: "create",
      entity: "training-subject",
      entityId: record.id,
      summary: `标记培训学科：${subject?.name ?? record.subjectId}`,
      userId: session.user?.id,
    });

    return NextResponse.json(
      { data: mapTrainingSubjectRecord(record, subject?.name ?? null) },
      { status: 201 }
    );
  } catch (err: unknown) {
    // 唯一约束冲突：同一学生同学科不重复
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "该学生已标记此培训学科" },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "创建培训学科失败", message },
      { status: 500 }
    );
  }
}
