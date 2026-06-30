import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/onboarding — 检查新手引导状态
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const [studentCount, courseCount, recordCount, mistakeCount, scoreCount, achievementCount] = await Promise.all([
    prisma.student.count(),
    prisma.course.count(),
    prisma.dailyRecord.count(),
    prisma.mistakeRecord.count(),
    prisma.examScore.count(),
    prisma.achievement.count(),
  ]);

  const steps = [
    { id: "student", label: "创建第一个学生档案", done: studentCount > 0, href: "/dashboard/students/new" },
    { id: "course", label: "安排第一节课", done: courseCount > 0, href: "/dashboard/courses" },
    { id: "record", label: "记录第一次学情", done: recordCount > 0, href: "/dashboard/records" },
    { id: "mistake", label: "录入第一道错题", done: mistakeCount > 0, href: "/dashboard/mistakes" },
    { id: "score", label: "录入第一次成绩", done: scoreCount > 0, href: "/dashboard/scores" },
    { id: "achievement", label: "记录竞赛成果", done: achievementCount > 0, href: "/dashboard/achievements" },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = completed === total;

  return NextResponse.json({
    data: {
      steps,
      completed,
      total,
      allDone,
      progress: Math.round((completed / total) * 100),
      hasStudents: studentCount > 0,
    },
  });
}
