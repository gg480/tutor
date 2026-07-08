import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/master-data/grades — 返回全部年级，按 order ASC 排序
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const grades = await prisma.grade.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json({ data: grades });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: "查询年级失败", message }, { status: 500 });
  }
}

// POST /api/master-data/grades — 新增年级
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.name || !body.level || body.order === undefined || !body.schoolTypes) {
      return NextResponse.json(
        { error: "缺少必要字段 name/level/order/schoolTypes" },
        { status: 400 }
      );
    }
    const grade = await prisma.grade.create({
      data: {
        name: body.name,
        level: body.level,
        order: Number(body.order),
        schoolTypes: body.schoolTypes,
      },
    });
    return NextResponse.json({ data: grade }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建失败";
    return NextResponse.json({ error: "创建年级失败", message }, { status: 500 });
  }
}
