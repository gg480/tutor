import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/settings — 获取系统信息
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // 系统统计
  const [totalStudents, totalCourses, totalUsers] = await Promise.all([
    prisma.student.count(),
    prisma.course.count(),
    prisma.user.count(),
  ]);

  return NextResponse.json({
    data: {
      user,
      system: {
        totalStudents,
        totalCourses,
        totalUsers,
        nodeEnv: process.env.NODE_ENV || "development",
        nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
      },
      studio: {
        name: "拾步工作室",
        slogan: "不是所有工作室，都叫「拾步」",
        since: "2026",
      },
    },
  });
}

// PUT /api/settings/password — 修改密码
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "请填写当前密码和新密码" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "新密码至少6位" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "当前密码错误" }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ message: "密码修改成功" });
  } catch (err: any) {
    return NextResponse.json({ error: "修改失败" }, { status: 500 });
  }
}
