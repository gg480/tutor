import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function formatICalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// GET /api/calendar?studentId=xxx — 导出iCal日历文件
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const where: any = {
    status: { in: ["scheduled", "completed"] },
  };
  if (studentId) where.studentId = studentId;

  const courses = await prisma.course.findMany({
    where,
    orderBy: { startTime: "asc" },
    take: 200,
    include: { student: { select: { name: true, grade: true } } },
  });

  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//拾步工作室//OPC Tutor Suite//ZH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:拾步课程表",
    "X-WR-TIMEZONE:Asia/Shanghai",
  ];

  courses.forEach((c) => {
    const uid = `${c.id}@shibu.opc`;
    const summary = `[${c.subject}] ${c.student.name}${c.courseType === "competition" ? " [竞赛]" : ""}`;
    const desc = `科目：${c.subject}\\n学生：${c.student.name}（${c.student.grade}）\\n类型：${c.courseType === "competition" ? "竞赛课" : c.courseType === "trial" ? "试听课" : "常规课"}\\n状态：${c.status === "completed" ? "已完成" : "待上课"}`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART:${formatICalDate(c.startTime)}`);
    lines.push(`DTEND:${formatICalDate(new Date(c.startTime.getTime() + c.duration * 60000))}`);
    lines.push(`SUMMARY:${escapeText(summary)}`);
    lines.push(`DESCRIPTION:${escapeText(desc)}`);
    lines.push(`STATUS:${c.status === "completed" ? "CONFIRMED" : "TENTATIVE"}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");

  const icalContent = lines.join("\r\n");

  return new NextResponse(icalContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="shibu_calendar_${now.toISOString().slice(0, 10)}.ics"`,
    },
  });
}
