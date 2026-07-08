import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// GET /api/achievements — 获取竞赛成果
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const where: any = {};
  if (studentId) where.studentId = studentId;

  const achievements = await prisma.achievement.findMany({
    where,
    orderBy: { awardDate: "desc" },
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

  const summary = {
    total: achievements.length,
    byLevel: {
      school: achievements.filter((a) => a.level === "school").length,
      city: achievements.filter((a) => a.level === "city").length,
      provincial: achievements.filter((a) => a.level === "provincial").length,
      national: achievements.filter((a) => a.level === "national").length,
      international: achievements.filter((a) => a.level === "international").length,
    },
    recentAwards: achievements.slice(0, 3),
  };

  return NextResponse.json({ data: achievements, summary });
}

// POST /api/achievements — 创建竞赛成果
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.studentId || !body.title || !body.awardDate) {
      return NextResponse.json(
        { error: "缺少必要字段（studentId/title/awardDate）" },
        { status: 400 }
      );
    }

    const achievement = await prisma.achievement.create({
      data: {
        studentId: body.studentId,
        title: body.title,
        level: body.level || "school",
        awardDate: new Date(body.awardDate),
        organization: body.organization || null,
        certificateUrl: body.certificateUrl || null,
        description: body.description || null,
      },
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

    await logActivity({ action: "create", entity: "achievement", entityId: achievement.id, summary: `竞赛获奖：${achievement.student.name} ${body.title}`, userId: session.user?.id });
    return NextResponse.json({ data: achievement }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "创建失败", message: err.message },
      { status: 400 }
    );
  }
}
