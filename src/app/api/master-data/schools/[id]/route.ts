import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/master-data/schools/[id] — 查询单条学校
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const school = await prisma.school.findUnique({ where: { id: params.id } });
    if (!school) {
      return NextResponse.json({ error: "学校不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: school });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: "查询学校失败", message }, { status: 500 });
  }
}

// PUT /api/master-data/schools/[id] — 更新学校
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    // 白名单方式提取允许更新的字段，防止数据注入
    const allowedFields = [
      "name", "district", "town", "level",
      "isKey", "keyLevel", "address", "verified",
    ];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field];
    }
    const school = await prisma.school.update({
      where: { id: params.id },
      data: data as never,
    });
    return NextResponse.json({ data: school });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新失败";
    return NextResponse.json({ error: "更新学校失败", message }, { status: 500 });
  }
}

// DELETE /api/master-data/schools/[id] — 删除学校
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    await prisma.school.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除失败";
    return NextResponse.json({ error: "删除学校失败", message }, { status: 500 });
  }
}
