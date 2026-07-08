import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/master-data/schools/[id]/grades — 学校年级联动
// 按 schoolId 查询 School.level，返回 Grade.schoolTypes contains 该 level 的年级，按 order ASC 排序
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const school = await prisma.school.findUnique({
      where: { id: params.id },
      select: { level: true },
    });
    if (!school) {
      return NextResponse.json({ error: "学校不存在" }, { status: 404 });
    }
    const grades = await prisma.grade.findMany({
      where: { schoolTypes: { contains: school.level } },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ data: grades });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: "查询年级联动失败", message }, { status: 500 });
  }
}
