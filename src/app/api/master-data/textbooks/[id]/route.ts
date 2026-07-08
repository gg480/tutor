import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/master-data/textbooks/[id] — 查询单条教材版本
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const textbook = await prisma.textbookVersion.findUnique({ where: { id: params.id } });
    if (!textbook) {
      return NextResponse.json({ error: "教材版本不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: textbook });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: "查询教材版本失败", message }, { status: 500 });
  }
}

// PUT /api/master-data/textbooks/[id] — 更新教材版本
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    const allowedFields = ["region", "gradeId", "subjectId", "version", "publisher"];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field];
    }
    const textbook = await prisma.textbookVersion.update({
      where: { id: params.id },
      data: data as never,
    });
    return NextResponse.json({ data: textbook });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新失败";
    return NextResponse.json({ error: "更新教材版本失败", message }, { status: 500 });
  }
}

// DELETE /api/master-data/textbooks/[id] — 删除教材版本
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    await prisma.textbookVersion.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除失败";
    return NextResponse.json({ error: "删除教材版本失败", message }, { status: 500 });
  }
}
