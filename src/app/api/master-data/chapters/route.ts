import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TextbookChapter } from "@prisma/client";

// 章节树节点：原章节字段 + children 子节点数组
type ChapterNode = TextbookChapter & { children: ChapterNode[] };

// 构建章节树：按 parentChapterId 分组组装 children 数组
function buildChapterTree(chapters: TextbookChapter[]): ChapterNode[] {
  const map = new Map<string, ChapterNode>();
  chapters.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: ChapterNode[] = [];
  chapters.forEach((c) => {
    const node = map.get(c.id);
    if (!node) return;
    if (c.parentChapterId && map.has(c.parentChapterId)) {
      map.get(c.parentChapterId)?.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// GET /api/master-data/chapters — 按 textbookVersionId 返回章节树形结构
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const textbookVersionId = searchParams.get("textbookVersionId");
    if (!textbookVersionId) {
      return NextResponse.json(
        { error: "缺少必要参数 textbookVersionId" },
        { status: 400 }
      );
    }
    const chapters = await prisma.textbookChapter.findMany({
      where: { textbookVersionId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ data: buildChapterTree(chapters) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: "查询章节失败", message }, { status: 500 });
  }
}

// POST /api/master-data/chapters — 新增章节
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.textbookVersionId || !body.chapterNo || !body.chapterName || body.order === undefined) {
      return NextResponse.json(
        { error: "缺少必要字段 textbookVersionId/chapterNo/chapterName/order" },
        { status: 400 }
      );
    }
    const chapter = await prisma.textbookChapter.create({
      data: {
        textbookVersionId: body.textbookVersionId,
        chapterNo: body.chapterNo,
        chapterName: body.chapterName,
        parentChapterId: body.parentChapterId ?? null,
        order: Number(body.order),
      },
    });
    return NextResponse.json({ data: chapter }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建失败";
    return NextResponse.json({ error: "创建章节失败", message }, { status: 500 });
  }
}
