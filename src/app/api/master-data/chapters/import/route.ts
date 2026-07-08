import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 解析单行 CSV（逗号分隔，去空格）
function parseCsvLine(line: string): string[] {
  return line.split(",").map((f) => f.trim());
}

// 处理单条章节导入，返回是否插入
// parentChapterNo 通过查询同 textbookVersionId 下 chapterNo 匹配的记录获取 parentChapterId
async function importOneChapter(fields: string[]): Promise<boolean> {
  // 字段顺序：textbookVersionId/chapterNo/chapterName/parentChapterNo/order
  const [textbookVersionId, chapterNo, chapterName, parentChapterNo, order] = fields;
  // order 需非空（"0" 为合法值，空字符串跳过）
  if (!textbookVersionId || !chapterNo || !chapterName || !order) {
    return false;
  }
  // 重复 textbookVersionId+chapterNo 跳过（唯一约束）
  const exists = await prisma.textbookChapter.findFirst({
    where: { textbookVersionId, chapterNo },
  });
  if (exists) return false;
  // 按 parentChapterNo 匹配同教材下的父章节 id
  let parentChapterId: string | null = null;
  if (parentChapterNo) {
    const parent = await prisma.textbookChapter.findFirst({
      where: { textbookVersionId, chapterNo: parentChapterNo },
      select: { id: true },
    });
    parentChapterId = parent?.id ?? null;
  }
  await prisma.textbookChapter.create({
    data: {
      textbookVersionId,
      chapterNo,
      chapterName,
      parentChapterId,
      order: Number(order),
    },
  });
  return true;
}

// POST /api/master-data/chapters/import — CSV 批量导入章节
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    const text: string = body.text ?? "";
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV 内容为空或仅含表头" },
        { status: 400 }
      );
    }
    // 首行表头跳过
    const dataLines = lines.slice(1);
    let inserted = 0;
    let skipped = 0;
    for (const line of dataLines) {
      const fields = parseCsvLine(line);
      if (fields.length < 5) {
        skipped++;
        continue;
      }
      const ok = await importOneChapter(fields);
      if (ok) inserted++;
      else skipped++;
    }
    return NextResponse.json({ inserted, skipped, total: dataLines.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "导入失败";
    return NextResponse.json({ error: "导入章节失败", message }, { status: 500 });
  }
}
