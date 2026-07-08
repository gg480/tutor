import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/learning-plans — 创建双轨制学习计划
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.studentId || !body.planName) {
      return NextResponse.json(
        { error: "缺少必要字段" },
        { status: 400 }
      );
    }

    const plan = await prisma.learningPlan.create({
      data: {
        studentId: body.studentId,
        planName: body.planName,
        schoolRatio: body.schoolRatio || 70,
        examRatio: body.examRatio || 30,
        totalHours: body.totalHours || null,
        price: body.price || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        notes: body.notes || null,
        status: "active",
      },
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: plan }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "创建学习计划失败", message: err.message },
      { status: 400 }
    );
  }
}

// GET /api/learning-plans?studentId=xxx — 获取学习计划
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const where: any = {};
  if (studentId) where.studentId = studentId;

  const plans = await prisma.learningPlan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          grade: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({ data: plans });
}
