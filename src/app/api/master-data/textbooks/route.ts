import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// 构造教材版本查询条件，支持 region/gradeId/subjectId 组合过滤
function buildTextbookWhere(
  region: string | null,
  gradeId: string | null,
  subjectId: string | null
): Prisma.TextbookVersionWhereInput {
  const where: Prisma.TextbookVersionWhereInput = {};
  if (region) where.region = region;
  if (gradeId) where.gradeId = gradeId;
  if (subjectId) where.subjectId = subjectId;
  return where;
}

// GET /api/master-data/textbooks — 教材版本列表，支持 region/gradeId/subjectId 组合过滤
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const where = buildTextbookWhere(
      searchParams.get("region"),
      searchParams.get("gradeId"),
      searchParams.get("subjectId")
    );
    const textbooks = await prisma.textbookVersion.findMany({ where });
    return NextResponse.json({ data: textbooks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: "查询教材版本失败", message }, { status: 500 });
  }
}

// POST /api/master-data/textbooks — 新增教材版本
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.region || !body.gradeId || !body.subjectId || !body.version) {
      return NextResponse.json(
        { error: "缺少必要字段 region/gradeId/subjectId/version" },
        { status: 400 }
      );
    }
    const textbook = await prisma.textbookVersion.create({
      data: {
        region: body.region,
        gradeId: body.gradeId,
        subjectId: body.subjectId,
        version: body.version,
        publisher: body.publisher ?? null,
      },
    });
    return NextResponse.json({ data: textbook }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建失败";
    return NextResponse.json({ error: "创建教材版本失败", message }, { status: 500 });
  }
}
