import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const data: any = {};

    if (body.status) data.status = body.status;
    if (body.trialDate) data.trialDate = new Date(body.trialDate);
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.convertedStudentId) data.convertedStudentId = body.convertedStudentId;

    const trial = await prisma.trial.update({
      where: { id: params.id },
      data,
      include: { convertedStudent: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ data: trial });
  } catch (err: any) {
    return NextResponse.json({ error: "更新失败" }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    await prisma.trial.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "删除失败", message: err.message }, { status: 400 });
  }
}
