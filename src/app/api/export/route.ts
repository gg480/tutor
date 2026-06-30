import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [
    headers.join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");
}

// GET /api/export?type=students — 导出CSV数据
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "students";
  const studentId = searchParams.get("studentId");

  let csv = "";
  let filename = "";

  try {
    switch (type) {
      case "students": {
        const students = await prisma.student.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            courseRegistrations: {
              where: { status: "active" },
              select: { remainingHours: true, totalHours: true },
            },
          },
        });

        csv = toCSV(
          ["姓名", "年级", "学校", "家长", "电话", "教材", "当前成绩", "剩余课时", "状态", "建档日期"],
          students.map((s) => [
            s.name,
            s.grade,
            s.school || "",
            s.parentName || "",
            s.parentPhone || "",
            s.textbook || "",
            s.currentScore || "",
            String(s.courseRegistrations[0]?.remainingHours ?? ""),
            s.status === "active" ? "在读" : s.status === "paused" ? "暂停" : "已结课",
            s.createdAt.toISOString().slice(0, 10),
          ])
        );
        filename = `学生列表_${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "records": {
        const where: any = {};
        if (studentId) where.studentId = studentId;

        const records = await prisma.dailyRecord.findMany({
          where,
          orderBy: { date: "desc" },
          include: { student: { select: { name: true } } },
        });

        csv = toCSV(
          ["学生", "日期", "掌握度", "学习状态", "作业完成", "教师记录", "下节课重点"],
          records.map((r) => [
            r.student.name,
            r.date.toISOString().slice(0, 10),
            String(r.masteryLevel),
            r.mood || "",
            r.homeworkComplete ? "是" : "否",
            r.teacherNotes || "",
            r.nextFocus || "",
          ])
        );
        filename = `学情记录_${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "mistakes": {
        const where: any = {};
        if (studentId) where.studentId = studentId;

        const mistakes = await prisma.mistakeRecord.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            student: { select: { name: true } },
            knowledgePoint: { select: { name: true } },
          },
        });

        const errorLabels: Record<string, string> = {
          careless: "粗心大意", concept: "概念不清", approach: "思路不对", unknown: "完全不会",
        };
        const statusLabels: Record<string, string> = {
          unsolved: "待解决", in_progress: "巩固中", mastered: "已掌握",
        };

        csv = toCSV(
          ["学生", "科目", "错因", "知识点", "状态", "同类做对次数", "内容", "日期"],
          mistakes.map((m) => [
            m.student.name,
            m.subject,
            errorLabels[m.errorType] || m.errorType,
            m.knowledgePoint?.name || "",
            statusLabels[m.status] || m.status,
            String(m.correctCount),
            m.originalContent || "",
            m.createdAt.toISOString().slice(0, 10),
          ])
        );
        filename = `错题数据_${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "scores": {
        const where: any = {};
        if (studentId) where.studentId = studentId;

        const scores = await prisma.examScore.findMany({
          where,
          orderBy: { examDate: "desc" },
          include: { student: { select: { name: true } } },
        });

        csv = toCSV(
          ["学生", "考试", "科目", "得分", "满分", "百分比", "类型", "日期"],
          scores.map((s) => [
            s.student.name,
            s.examName,
            s.subject,
            String(s.score),
            String(s.totalScore),
            `${Math.round((s.score / s.totalScore) * 100)}%`,
            s.examType === "school" ? "校内" : s.examType === "competition" ? "竞赛" : "模拟",
            s.examDate.toISOString().slice(0, 10),
          ])
        );
        filename = `成绩数据_${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      default:
        return NextResponse.json({ error: "不支持的导出类型" }, { status: 400 });
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "导出失败", message: err.message }, { status: 500 });
  }
}
