import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/revenue — 月度收入报表
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    // 获取所有课程包
    const registrations = await prisma.courseRegistration.findMany({
      where: { status: { not: "refunded" } },
      select: {
        id: true, price: true, totalHours: true, usedHours: true,
        remainingHours: true, status: true, createdAt: true,
        student: { select: { name: true } },
      },
    });

    // 获取所有已完成课程（按月份）
    const courses = await prisma.course.findMany({
      where: { status: "completed", registrationId: { not: null } },
      select: {
        startTime: true,
        registrationId: true,
        registration: { select: { price: true, totalHours: true } },
      },
    });

    // 按月度汇总已确认收入
    const monthlyRevenue = new Map<string, {
      courses: number; revenue: number; hours: number;
    }>();

    courses.forEach((c) => {
      const month = new Date(c.startTime).toISOString().slice(0, 7);
      if (!monthlyRevenue.has(month)) {
        monthlyRevenue.set(month, { courses: 0, revenue: 0, hours: 0 });
      }
      const m = monthlyRevenue.get(month)!;
      m.courses++;
      if (c.registration && c.registration.totalHours > 0) {
        m.revenue += (c.registration.price || 0) / c.registration.totalHours;
      }
    });

    // 按月度汇总新增签约
    const monthlySignups = new Map<string, { count: number; value: number }>();
    registrations.forEach((r) => {
      const month = r.createdAt.toISOString().slice(0, 7);
      if (!monthlySignups.has(month)) {
        monthlySignups.set(month, { count: 0, value: 0 });
      }
      const m = monthlySignups.get(month)!;
      m.count++;
      m.value += r.price || 0;
    });

    // 合并所有月份
    const allMonths = new Set([
      ...Array.from(monthlyRevenue.keys()),
      ...Array.from(monthlySignups.keys()),
    ]);

    const monthlyData = Array.from(allMonths)
      .sort()
      .map((month) => ({
        month,
        revenue: Math.round(monthlyRevenue.get(month)?.revenue || 0),
        courses: monthlyRevenue.get(month)?.courses || 0,
        newSignups: monthlySignups.get(month)?.count || 0,
        newValue: Math.round(monthlySignups.get(month)?.value || 0),
      }));

    // 总计
    const totals = {
      totalRevenue: monthlyData.reduce((s, m) => s + m.revenue, 0),
      totalCourses: monthlyData.reduce((s, m) => s + m.courses, 0),
      totalSignups: monthlyData.reduce((s, m) => s + m.newSignups, 0),
      totalValue: monthlyData.reduce((s, m) => s + m.newValue, 0),
    };

    // 当前预收款余额
    const prepaymentBalance = registrations
      .filter((r) => r.status === "active")
      .reduce((s, r) => {
        if (r.totalHours === 0) return s;
        return s + ((r.price || 0) * r.remainingHours) / r.totalHours;
      }, 0);

    return NextResponse.json({
      data: {
        monthlyData,
        totals,
        prepaymentBalance: Math.round(prepaymentBalance),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}
