import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/master-data/chapters/[id] — 查询单条章节
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const chapter = await prisma.textbookChapter.findUnique({ where: { id: params.id } });
    if (!chapter) {
      return NextResponse.json({ error: "章节不存在" }, { status: 404 });
    }
    return NextResponse.json({ data: chapter });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: "查询章节失败", message }, { status: 500 });
  }
}

// PUT /api/master-data/chapters/[id] — 更新章节
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    const allowedFields = [
      "textbookVersionId", "chapterNo", "chapterName", "parentChapterId", "order",
    ];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = field === "order" ? Number(body[field]) : body[field];
      }
    }
    const chapter = await prisma.textbookChapter.update({
      where: { id: params.id },
      data: data as never,
    });
    return NextResponse.json({ data: chapter });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新失败";
    return NextResponse.json({ error: "更新章节失败", message }, { status: 500 });
  }
}

// DELETE /api/master-data/chapters/[id] — 删除章节
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    await prisma.textbookChapter.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除失败";
    return NextResponse.json({ error: "删除章节失败", message }, { status: 500 });
  }
}
