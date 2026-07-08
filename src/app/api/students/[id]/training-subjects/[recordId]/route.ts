import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  validateTrainingSubjectUpdate,
  buildTrainingSubjectUpdateData,
  mapTrainingSubjectRecord,
} from "@/lib/training-subject-validation";

// PUT /api/students/[id]/training-subjects/[recordId] — 更新培训学科
// 特殊逻辑：status 改为 "ended" 时，若 endDate 未传，自动设为今日
export async function PUT(
  req: Request,
  { params }: { params: { id: string; recordId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const error = validateTrainingSubjectUpdate(body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // 确认记录存在且属于该学生
    const existing = await prisma.studentTrainingSubject.findUnique({
      where: { id: params.recordId },
    });
    if (!existing || existing.studentId !== params.id) {
      return NextResponse.json(
        { error: "培训学科记录不存在" },
        { status: 404 }
      );
    }

    const record = await prisma.studentTrainingSubject.update({
      where: { id: params.recordId },
      data: buildTrainingSubjectUpdateData(body),
    });

    // 查询学科名称（StudentTrainingSubject 无 subject 关系字段）
    const subject = await prisma.subject.findUnique({
      where: { id: record.subjectId },
      select: { name: true },
    });

    await logActivity({
      action: "update",
      entity: "training-subject",
      entityId: record.id,
      summary: `更新培训学科：${subject?.name ?? record.subjectId}`,
      userId: session.user?.id,
    });

    return NextResponse.json({
      data: mapTrainingSubjectRecord(record, subject?.name ?? null),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "更新培训学科失败", message },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id]/training-subjects/[recordId] — 删除培训学科
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; recordId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const existing = await prisma.studentTrainingSubject.findUnique({
      where: { id: params.recordId },
    });
    if (!existing || existing.studentId !== params.id) {
      return NextResponse.json(
        { error: "培训学科记录不存在" },
        { status: 404 }
      );
    }

    await prisma.studentTrainingSubject.delete({
      where: { id: params.recordId },
    });

    // 查询学科名称用于日志摘要
    const subject = await prisma.subject.findUnique({
      where: { id: existing.subjectId },
      select: { name: true },
    });

    await logActivity({
      action: "delete",
      entity: "training-subject",
      entityId: params.recordId,
      summary: `删除培训学科：${subject?.name ?? existing.subjectId}`,
      userId: session.user?.id,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "删除培训学科失败", message },
      { status: 500 }
    );
  }
}
