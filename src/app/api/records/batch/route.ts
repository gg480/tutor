import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// POST /api/records/batch — 批量创建学情记录
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const { studentIds, date, teacherNotes, masteryLevel, mood, homeworkComplete, nextFocus } = body;

    if (!studentIds?.length) {
      return NextResponse.json({ error: "请选择学生" }, { status: 400 });
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const studentId of studentIds) {
      try {
        await prisma.dailyRecord.create({
          data: {
            studentId,
            date: date ? new Date(date) : new Date(),
            teacherNotes: teacherNotes || null,
            masteryLevel: masteryLevel || 3,
            mood: mood || "normal",
            homeworkComplete: homeworkComplete === "true" ? true : homeworkComplete === "false" ? false : typeof homeworkComplete === "boolean" ? homeworkComplete : null,
            nextFocus: nextFocus || null,
          },
        });
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`学生 ${studentId}: ${err.message}`);
      }
    }

    await logActivity({
      action: "create",
      entity: "record",
      summary: `批量学情记录：成功${results.success}条，失败${results.failed}条`,
      userId: session.user?.id,
    });

    return NextResponse.json({
      data: results,
      message: `成功记录 ${results.success} 条学情${results.failed > 0 ? `，${results.failed} 条失败` : ""}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "批量创建失败" }, { status: 400 });
  }
}
