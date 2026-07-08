import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { validateScoreInput, buildScoreData, mapScoreRecord } from "@/lib/score-validation";

// GET /api/students/[id]/scores — 获取学生所有成绩记录
// 查询参数：subjectId（按学科过滤）、examType（按考试类型过滤），默认按 examDate DESC
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const examType = searchParams.get("examType");

    const where: {
      studentId: string;
      subjectId?: string;
      examType?: string;
    } = { studentId: params.id };
    if (subjectId) where.subjectId = subjectId;
    if (examType) where.examType = examType;

    const records = await prisma.studentSubjectRecord.findMany({
      where,
      orderBy: { examDate: "desc" },
    });

    // StudentSubjectRecord 无 subject 关系字段，需单独查询学科名后内存合并
    const subjectIds = [...new Set(records.map((r) => r.subjectId))];
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    });
    const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

    return NextResponse.json({
      data: records.map((r) =>
        mapScoreRecord(r, subjectMap.get(r.subjectId) ?? null)
      ),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "获取成绩列表失败", message },
      { status: 500 }
    );
  }
}

// POST /api/students/[id]/scores — 新增单条成绩记录
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const error = validateScoreInput(body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const record = await prisma.studentSubjectRecord.create({
      data: buildScoreData(body, params.id),
    });

    // 查询学科名称（StudentSubjectRecord 无 subject 关系字段）
    const subject = await prisma.subject.findUnique({
      where: { id: record.subjectId },
      select: { name: true },
    });

    await logActivity({
      action: "create",
      entity: "score",
      entityId: record.id,
      summary: `录入成绩：${record.examName}`,
      userId: session.user?.id,
    });

    return NextResponse.json(
      { data: mapScoreRecord(record, subject?.name ?? null) },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "创建成绩失败", message },
      { status: 500 }
    );
  }
}
