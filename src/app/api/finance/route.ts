import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/finance — 财务数据聚合
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    // 获取所有课程包
    const registrations = await prisma.courseRegistration.findMany({
      where: { status: { not: "refunded" } },
      include: {
        student: { select: { id: true, name: true, grade: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // ========== 核心财务指标 ==========

    // 总预收款（所有课程包价格之和）
    const totalPrepayments = registrations.reduce(
      (sum, r) => sum + (r.price || 0),
      0
    );

    // 已确认收入（按耗课比例确认）
    const recognizedRevenue = registrations.reduce((sum, r) => {
      if (r.totalHours === 0) return sum;
      const rate = r.usedHours / r.totalHours;
      return sum + (r.price || 0) * rate;
    }, 0);

    // 待确认收入（未耗课部分 = 负债）
    const deferredRevenue = totalPrepayments - recognizedRevenue;

    // 平均课时单价
    const totalHours = registrations.reduce((s, r) => s + r.totalHours, 0);
    const avgPricePerHour =
      totalHours > 0
        ? Math.round(registrations.reduce((s, r) => s + (r.price || 0), 0) / totalHours)
        : 0;

    // ========== 耗课统计 ==========

    const totalUsedHours = registrations.reduce((s, r) => s + r.usedHours, 0);
    const totalRemainingHours = registrations.reduce(
      (s, r) => s + r.remainingHours,
      0
    );
    const consumptionRate =
      totalHours > 0
        ? Math.round((totalUsedHours / totalHours) * 100)
        : 0;

    // 活跃课程包数
    const activeRegistrations = registrations.filter(
      (r) => r.status === "active"
    ).length;

    // ========== 续费预警 ==========

    // 剩余课时≤3的课程包（需要提醒续费）
    const lowHourRegistrations = registrations
      .filter((r) => r.remainingHours <= 3 && r.status === "active")
      .map((r) => ({
        id: r.id,
        studentName: r.student.name,
        grade: r.student.grade,
        packageName: r.packageName,
        remainingHours: r.remainingHours,
        totalHours: r.totalHours,
        usedPercent: Math.round((r.usedHours / r.totalHours) * 100),
      }));

    // ========== 月度收入趋势 ==========

    // 按月份聚合课程消耗（模拟收入确认）
    const courses = await prisma.course.findMany({
      where: {
        status: "completed",
        registrationId: { not: null },
        startTime: {
          gte: new Date(new Date().getFullYear(), 0, 1), // 今年开始
        },
      },
      select: {
        startTime: true,
        registration: {
          select: { price: true, totalHours: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // 按月汇总
    const monthlyMap = new Map<
      string,
      { courses: number; revenue: number; hours: number }
    >();
    courses.forEach((c) => {
      const monthKey = new Date(c.startTime)
        .toISOString()
        .slice(0, 7);
      if (!monthlyMap.has(monthKey))
        monthlyMap.set(monthKey, { courses: 0, revenue: 0, hours: 0 });
      const m = monthlyMap.get(monthKey)!;
      m.courses++;
      // 每节课按比例确认收入
      if (c.registration && c.registration.totalHours > 0) {
        m.revenue +=
          (c.registration.price || 0) / c.registration.totalHours;
      }
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        courses: data.courses,
        revenue: Math.round(data.revenue),
        hours: data.hours,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // ========== 所有课程包详情 ==========

    const registrationsList = registrations.map((r) => ({
      id: r.id,
      studentName: r.student.name,
      grade: r.student.grade,
      packageName: r.packageName,
      totalHours: r.totalHours,
      usedHours: r.usedHours,
      remainingHours: r.remainingHours,
      price: r.price,
      consumedValue: r.totalHours > 0 ? Math.round((r.price || 0) * (r.usedHours / r.totalHours)) : 0,
      remainingValue: r.totalHours > 0 ? Math.round((r.price || 0) * (r.remainingHours / r.totalHours)) : 0,
      usedPercent: r.totalHours > 0 ? Math.round((r.usedHours / r.totalHours) * 100) : 0,
      status: r.status,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      data: {
        summary: {
          totalPrepayments: Math.round(totalPrepayments),
          recognizedRevenue: Math.round(recognizedRevenue),
          deferredRevenue: Math.round(deferredRevenue),
          avgPricePerHour,
          consumptionRate,
          totalUsedHours,
          totalRemainingHours,
          totalHours,
          activeRegistrations,
          totalStudents: new Set(registrations.map((r) => r.studentId)).size,
        },
        alerts: {
          lowHourCount: lowHourRegistrations.length,
          lowHourRegistrations,
        },
        charts: {
          monthlyTrend,
        },
        registrations: registrationsList,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "获取财务数据失败", message: err.message },
      { status: 500 }
    );
  }
}
