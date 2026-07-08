import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/reports?studentId=xxx — 获取学生学习报告数据
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "缺少学生ID" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      school: { select: { name: true } },
      grade: { select: { name: true } },
      diagnosticReports: { orderBy: { createdAt: "desc" }, take: 1 },
      learningPlans: { orderBy: { createdAt: "desc" }, take: 1 },
      courseRegistrations: { where: { status: "active" } },
      dailyRecords: { orderBy: { date: "desc" }, take: 30 },
      mistakeRecords: {
        include: { knowledgePoint: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      examScores: { orderBy: { examDate: "desc" }, take: 20 },
      courses: {
        where: { status: "completed" },
        orderBy: { startTime: "desc" },
        take: 50,
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "学生不存在" }, { status: 404 });
  }

  // 计算统计数据
  const totalCourses = student.courses.length;
  const totalHours = student.courses.reduce(
    (sum, c) => sum + c.duration,
    0
  );
  const avgMastery =
    student.dailyRecords.length > 0
      ? Math.round(
          (student.dailyRecords.reduce(
            (sum, r) => sum + r.masteryLevel,
            0
          ) /
            student.dailyRecords.length) *
            10
        ) / 10
      : 0;

  const mistakeByType = {
    careless: student.mistakeRecords.filter((m) => m.errorType === "careless").length,
    concept: student.mistakeRecords.filter((m) => m.errorType === "concept").length,
    approach: student.mistakeRecords.filter((m) => m.errorType === "approach").length,
    unknown: student.mistakeRecords.filter((m) => m.errorType === "unknown").length,
  };

  const masteredCount = student.mistakeRecords.filter(
    (m) => m.status === "mastered"
  ).length;

  return NextResponse.json({
    data: {
      student: {
        id: student.id,
        name: student.name,
        gradeName: student.grade.name,
        schoolName: student.school?.name ?? null,
        summary: student.summary,
        createdAt: student.createdAt,
        parentName: student.parentName,
      },
      stats: {
        totalCourses,
        totalHours: Math.round(totalHours / 60),
        avgMastery,
        totalMistakes: student.mistakeRecords.length,
        masteredMistakes: masteredCount,
        mistakeByType,
        totalScores: student.examScores.length,
      },
      recentRecords: student.dailyRecords.slice(0, 10),
      recentScores: student.examScores.slice(0, 10),
      mistakeAnalysis: student.mistakeRecords,
      learningPlan: student.learningPlans[0] || null,
      registration: student.courseRegistrations[0] || null,
    },
  });
}
