import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/master-data/grades/[id] — 查询单条年级
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const grade = await prisma.grade.findUnique({ where: { id: params.id } });
    if (!grade) {
      return NextResponse.json({ error: "年级不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: grade });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: "查询年级失败", message }, { status: 500 });
  }
}

// PUT /api/master-data/grades/[id] — 更新年级
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    const allowedFields = ["name", "level", "order", "schoolTypes"];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = field === "order" ? Number(body[field]) : body[field];
      }
    }
    const grade = await prisma.grade.update({
      where: { id: params.id },
      data: data as never,
    });
    return NextResponse.json({ data: grade });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新失败";
    return NextResponse.json({ error: "更新年级失败", message }, { status: 500 });
  }
}

// DELETE /api/master-data/grades/[id] — 删除年级
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    await prisma.grade.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除失败";
    return NextResponse.json({ error: "删除年级失败", message }, { status: 500 });
  }
}
