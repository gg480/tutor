import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT /api/mistakes/[id] — 更新错题状态
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const data: any = {};
    if (body.status) data.status = body.status;
    if (body.correctCount !== undefined) data.correctCount = body.correctCount;
    if (body.errorType) data.errorType = body.errorType;
    if (body.knowledgePointId) data.knowledgePointId = body.knowledgePointId;
    if (body.status === "mastered") {
      data.lastReviewedAt = new Date();
    }

    const mistake = await prisma.mistakeRecord.update({
      where: { id: params.id },
      data,
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: mistake });
  } catch (err: any) {
    return NextResponse.json({ error: "更新失败" }, { status: 400 });
  }
}

// DELETE /api/mistakes/[id]
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    await prisma.mistakeRecord.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "删除失败" }, { status: 400 });
  }
}
