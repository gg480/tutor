import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// GET /api/events — 获取活动列表
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const events = await prisma.studyEvent.findMany({
    orderBy: { startTime: "desc" },
    include: {
      _count: { select: { participants: true } },
    },
  });

  return NextResponse.json({ data: events });
}

// POST /api/events — 创建活动
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.title || !body.startTime || !body.endTime) {
      return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
    }

    const event = await prisma.studyEvent.create({
      data: {
        title: body.title,
        type: body.type || "self_study",
        description: body.description || null,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        location: body.location || null,
        maxParticipants: body.maxParticipants ? parseInt(body.maxParticipants) : 10,
        fee: body.fee ? parseFloat(body.fee) : null,
        status: "scheduled",
      },
    });

    await logActivity({ action: "create", entity: "event", entityId: event.id, summary: `创建活动：${event.title}`, userId: session.user?.id });
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "创建失败" }, { status: 400 });
  }
}
