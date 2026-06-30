import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// DELETE /api/knowledge-points/[id] — 删除知识点
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    // 先将子知识点的 parentId 置空，再删除父节点，避免外键约束错误
    await prisma.knowledgePoint.updateMany({
      where: { parentId: params.id },
      data: { parentId: null },
    });
    await prisma.knowledgePoint.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "删除失败", message: err.message }, { status: 400 });
  }
}
