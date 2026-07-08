import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/master-data/subjects/[id] — 查询单条学科
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const subject = await prisma.subject.findUnique({ where: { id: params.id } });
    if (!subject) {
      return NextResponse.json({ error: "学科不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: subject });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: "查询学科失败", message }, { status: 500 });
  }
}

// PUT /api/master-data/subjects/[id] — 更新学科
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    const allowedFields = [
      "name", "category", "examTypes", "applicableLevels", "isCompetition",
    ];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field];
    }
    const subject = await prisma.subject.update({
      where: { id: params.id },
      data: data as never,
    });
    return NextResponse.json({ data: subject });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新失败";
    return NextResponse.json({ error: "更新学科失败", message }, { status: 500 });
  }
}

// DELETE /api/master-data/subjects/[id] — 删除学科
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    await prisma.subject.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除失败";
    return NextResponse.json({ error: "删除学科失败", message }, { status: 500 });
  }
}
