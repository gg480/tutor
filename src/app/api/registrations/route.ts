import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// GET /api/registrations?studentId=xxx — 获取课程包列表
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const where: any = {};
  if (studentId) where.studentId = studentId;

  const registrations = await prisma.courseRegistration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { id: true, name: true, grade: true } },
      courses: {
        where: { status: "completed" },
        select: { id: true },
      },
    },
  });

  return NextResponse.json({ data: registrations });
}

// POST /api/registrations — 创建课程包
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.studentId || !body.packageName || !body.totalHours) {
      return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
    }

    const registration = await prisma.courseRegistration.create({
      data: {
        studentId: body.studentId,
        packageName: body.packageName,
        totalHours: parseInt(body.totalHours),
        usedHours: 0,
        remainingHours: parseInt(body.totalHours),
        price: body.price ? parseFloat(body.price) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: "active",
      },
      include: { student: { select: { id: true, name: true } } },
    });

    await logActivity({ action: "create", entity: "registration", entityId: registration.id, summary: `新建课程包：${registration.student.name} ${body.packageName}`, userId: session.user?.id });
    return NextResponse.json({ data: registration }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "创建课程包失败", message: err.message },
      { status: 400 }
    );
  }
}
