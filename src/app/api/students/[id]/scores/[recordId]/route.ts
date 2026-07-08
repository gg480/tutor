import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { validateScoreInput, buildScoreData, mapScoreRecord } from "@/lib/score-validation";

// PUT /api/students/[id]/scores/[recordId] — 更新单条成绩记录
// studentId 不可改（从 URL 取，不从 body 取）
export async function PUT(
  req: Request,
  { params }: { params: { id: string; recordId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const error = validateScoreInput(body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // 确认记录存在且属于该学生
    const existing = await prisma.studentSubjectRecord.findUnique({
      where: { id: params.recordId },
    });
    if (!existing || existing.studentId !== params.id) {
      return NextResponse.json({ error: "成绩记录不存在" }, { status: 404 });
    }

    const record = await prisma.studentSubjectRecord.update({
      where: { id: params.recordId },
      data: buildScoreData(body, params.id),
    });

    // 查询学科名称（StudentSubjectRecord 无 subject 关系字段）
    const subject = await prisma.subject.findUnique({
      where: { id: record.subjectId },
      select: { name: true },
    });

    await logActivity({
      action: "update",
      entity: "score",
      entityId: record.id,
      summary: `更新成绩：${record.examName}`,
      userId: session.user?.id,
    });

    return NextResponse.json({
      data: mapScoreRecord(record, subject?.name ?? null),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "更新成绩失败", message },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id]/scores/[recordId] — 删除单条成绩记录
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; recordId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const existing = await prisma.studentSubjectRecord.findUnique({
      where: { id: params.recordId },
    });
    if (!existing || existing.studentId !== params.id) {
      return NextResponse.json({ error: "成绩记录不存在" }, { status: 404 });
    }

    await prisma.studentSubjectRecord.delete({
      where: { id: params.recordId },
    });

    await logActivity({
      action: "delete",
      entity: "score",
      entityId: params.recordId,
      summary: `删除成绩：${existing.examName}`,
      userId: session.user?.id,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "删除成绩失败", message },
      { status: 500 }
    );
  }
}
