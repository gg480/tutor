import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// GET /api/trials — 试听列表
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const trials = await prisma.trial.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      convertedStudent: { select: { id: true, name: true } },
    },
  });

  const summary = {
    total: trials.length,
    contacted: trials.filter((t) => t.status === "contacted").length,
    scheduled: trials.filter((t) => t.status === "trial_scheduled").length,
    done: trials.filter((t) => t.status === "trial_done").length,
    converted: trials.filter((t) => t.status === "converted").length,
    lost: trials.filter((t) => t.status === "lost").length,
    conversionRate:
      trials.length > 0
        ? Math.round(
            (trials.filter((t) => t.status === "converted").length /
              trials.length) *
              100
          )
        : 0,
  };

  return NextResponse.json({ data: trials, summary });
}

// POST /api/trials — 创建试听记录
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.studentName || !body.grade) {
      return NextResponse.json({ error: "缺少学生姓名或年级" }, { status: 400 });
    }

    const trial = await prisma.trial.create({
      data: {
        studentName: body.studentName,
        grade: body.grade,
        parentName: body.parentName || null,
        parentPhone: body.parentPhone || null,
        subject: body.subject || null,
        source: body.source || "wechat",
        status: body.status || "contacted",
        trialDate: body.trialDate ? new Date(body.trialDate) : null,
        notes: body.notes || null,
      },
    });

    await logActivity({ action: "create", entity: "trial", entityId: trial.id, summary: `新建试听线索：${trial.studentName}`, userId: session.user?.id });
    return NextResponse.json({ data: trial }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "创建失败" }, { status: 400 });
  }
}

// PUT /api/trials/[id] — 更新状态（路由在 [id].ts)
