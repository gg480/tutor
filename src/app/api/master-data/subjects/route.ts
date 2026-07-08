import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET /api/master-data/subjects — 学科列表，可选 level 按 applicableLevels contains 过滤
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");
    const where: Prisma.SubjectWhereInput = level
      ? { applicableLevels: { contains: level } }
      : {};
    const subjects = await prisma.subject.findMany({ where });
    return NextResponse.json({ data: subjects });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: "查询学科失败", message }, { status: 500 });
  }
}

// POST /api/master-data/subjects — 新增学科
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.name || !body.category || !body.examTypes || !body.applicableLevels) {
      return NextResponse.json(
        { error: "缺少必要字段 name/category/examTypes/applicableLevels" },
        { status: 400 }
      );
    }
    const subject = await prisma.subject.create({
      data: {
        name: body.name,
        category: body.category,
        examTypes: body.examTypes,
        applicableLevels: body.applicableLevels,
        isCompetition: body.isCompetition ?? false,
      },
    });
    return NextResponse.json({ data: subject }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建失败";
    return NextResponse.json({ error: "创建学科失败", message }, { status: 500 });
  }
}
