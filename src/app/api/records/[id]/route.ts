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
    // 白名单方式显式提取允许更新的字段，防止数据注入
    const allowedFields = [
      "teacherNotes", "masteryLevel", "homeworkComplete",
      "mood", "nextFocus", "suggestions",
    ];
    const data: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }
    if (body.knowledgePoints !== undefined) {
      data.knowledgePoints = JSON.stringify(body.knowledgePoints);
    }
    if (body.date !== undefined) {
      data.date = new Date(body.date);
    }

    const record = await prisma.dailyRecord.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ data: record });
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
    await prisma.dailyRecord.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "删除失败" }, { status: 400 });
  }
}
