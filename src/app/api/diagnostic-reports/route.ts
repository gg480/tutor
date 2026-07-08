import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// POST /api/diagnostic-reports — 创建诊断报告
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.studentId) {
      return NextResponse.json({ error: "缺少学生ID" }, { status: 400 });
    }

    const report = await prisma.diagnosticReport.create({
      data: {
        studentId: body.studentId,
        subjectiveInfo: body.subjectiveInfo || null,
        objectiveInfo: body.objectiveInfo || null,
        weaknessAnalysis: body.weaknessAnalysis
          ? JSON.stringify(body.weaknessAnalysis)
          : null,
        teacherNotes: body.teacherNotes || null,
        conclusion: body.conclusion || null,
        recommendations: body.recommendations || null,
        status: "final",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            grade: { select: { name: true } },
            school: { select: { name: true } },
          },
        },
      },
    });

    await logActivity({ action: "create", entity: "report", entityId: report.id, summary: `生成诊断报告：${report.student.name}`, userId: session.user?.id });
    return NextResponse.json({ data: report }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "创建诊断报告失败", message: err.message },
      { status: 400 }
    );
  }
}

// GET /api/diagnostic-reports?studentId=xxx — 获取诊断报告列表
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const where: any = {};
  if (studentId) where.studentId = studentId;

  const reports = await prisma.diagnosticReport.findMany({
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

  return NextResponse.json({ data: reports });
}
