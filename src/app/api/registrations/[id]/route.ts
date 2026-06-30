import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT /api/registrations/[id] — 更新课程包（续费/变更）
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const data: any = {};

    // 续费：增加总课时和剩余课时
    if (body.addHours) {
      data.totalHours = { increment: parseInt(body.addHours) };
      data.remainingHours = { increment: parseInt(body.addHours) };
    }
    if (body.addPrice) {
      data.price = { increment: parseFloat(body.addPrice) };
    }
    if (body.status) data.status = body.status;

    const registration = await prisma.courseRegistration.update({
      where: { id: params.id },
      data,
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: registration });
  } catch (err: any) {
    return NextResponse.json(
      { error: "更新失败", message: err.message },
      { status: 400 }
    );
  }
}
