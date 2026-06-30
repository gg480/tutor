import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/health — 系统健康检查（无需登录）
export async function GET() {
  const checks: Record<string, { status: string; detail?: string }> = {};

  // 1. 数据库连接
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok" };
  } catch (err: any) {
    checks.database = { status: "error", detail: err.message };
  }

  // 2. 数据库表
  try {
    const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    checks.tables = {
      status: "ok",
      detail: `${tables.length} 张表（${tables.map((t) => t.name).join(", ")}）`,
    };
  } catch (err: any) {
    checks.tables = { status: "error", detail: err.message };
  }

  // 3. 数据统计
  try {
    const [students, courses, records, mistakes] = await Promise.all([
      prisma.student.count(),
      prisma.course.count(),
      prisma.dailyRecord.count(),
      prisma.mistakeRecord.count(),
    ]);
    checks.data = {
      status: "ok",
      detail: `学生${students}人 · 课程${courses}节 · 学情${records}条 · 错题${mistakes}道`,
    };
  } catch (err: any) {
    checks.data = { status: "error", detail: err.message };
  }

  // 4. 环境变量
  const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  checks.environment = {
    status: "ok",
    detail: `NEXTAUTH_URL=${nextAuthUrl} · NODE_ENV=${process.env.NODE_ENV || "development"}`,
  };

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
}
