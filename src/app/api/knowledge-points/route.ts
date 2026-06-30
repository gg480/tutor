import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/knowledge-points — 获取全部知识点
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const points = await prisma.knowledgePoint.findMany({
    orderBy: [{ grade: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { mistakes: true } } },
  });

  const bySubject = points.reduce<Record<string, typeof points>>((acc, p) => {
    if (!acc[p.subject]) acc[p.subject] = [];
    acc[p.subject].push(p);
    return acc;
  }, {});

  return NextResponse.json({ data: points, bySubject });
}

// POST /api/knowledge-points — 创建知识点
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.subject || !body.grade || !body.name) {
      return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
    }

    const maxOrder = await prisma.knowledgePoint.findFirst({
      where: { subject: body.subject, grade: body.grade, level: body.level || 2 },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const point = await prisma.knowledgePoint.create({
      data: {
        subject: body.subject,
        grade: body.grade,
        name: body.name,
        parentId: body.parentId || null,
        level: body.level || 2,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({ data: point }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "创建失败" }, { status: 400 });
  }
}
