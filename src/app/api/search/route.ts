import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/search?q=xxx — 全局搜索
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ data: { students: [], courses: [], records: [], mistakes: [], scores: [] } });
  }

  const [students, courses, records, mistakes, scores] = await Promise.all([
    prisma.student.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { school: { contains: q } },
          { parentName: { contains: q } },
          { parentGoal: { contains: q } },
          { weakness: { contains: q } },
        ],
      },
      select: { id: true, name: true, grade: true, school: true, status: true },
      take: 10,
    }),
    prisma.course.findMany({
      where: {
        OR: [
          { subject: { contains: q } },
          { student: { name: { contains: q } } },
        ],
      },
      select: { id: true, subject: true, courseType: true, startTime: true, status: true, student: { select: { name: true } } },
      take: 10,
    }),
    prisma.dailyRecord.findMany({
      where: { teacherNotes: { contains: q } },
      select: { id: true, date: true, masteryLevel: true, teacherNotes: true, student: { select: { name: true } } },
      take: 10,
    }),
    prisma.mistakeRecord.findMany({
      where: {
        OR: [
          { originalContent: { contains: q } },
          { correctAnswer: { contains: q } },
          { student: { name: { contains: q } } },
        ],
      },
      select: { id: true, subject: true, errorType: true, originalContent: true, status: true, student: { select: { name: true } } },
      take: 10,
    }),
    prisma.examScore.findMany({
      where: {
        OR: [
          { examName: { contains: q } },
          { subject: { contains: q } },
          { student: { name: { contains: q } } },
        ],
      },
      select: { id: true, examName: true, subject: true, score: true, totalScore: true, student: { select: { name: true } } },
      take: 10,
    }),
  ]);

  const total = students.length + courses.length + records.length + mistakes.length + scores.length;

  return NextResponse.json({
    data: { students, courses, records, mistakes, scores },
    total,
    query: q,
  });
}
