import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, School } from "@prisma/client";

// 构造学校列表查询条件，district 默认南海区
function buildSchoolWhere(
  search: string | null,
  level: string | null,
  town: string | null,
  district: string | null
): Prisma.SchoolWhereInput {
  const where: Prisma.SchoolWhereInput = { district: district ?? "南海区" };
  if (level) where.level = level;
  if (town) where.town = town;
  if (search) where.name = { contains: search };
  return where;
}

// 分组排序：非高中（小学/初中/九年一贯）按 town ASC，高中按 isKey DESC + keyLevel ASC
function sortSchoolsByLevel(list: School[]): School[] {
  const lower = list
    .filter((s) => s.level !== "senior")
    .sort((a, b) => (a.town ?? "").localeCompare(b.town ?? ""));
  const senior = list
    .filter((s) => s.level === "senior")
    .sort(
      (a, b) =>
        Number(b.isKey) - Number(a.isKey) ||
        (a.keyLevel ?? "").localeCompare(b.keyLevel ?? "")
    );
  return [...lower, ...senior];
}

// GET /api/master-data/schools — 列表+搜索+排序
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const where = buildSchoolWhere(
      searchParams.get("search"),
      searchParams.get("level"),
      searchParams.get("town"),
      searchParams.get("district")
    );
    const schools = await prisma.school.findMany({ where });
    return NextResponse.json({ data: sortSchoolsByLevel(schools) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: "查询学校失败", message }, { status: 500 });
  }
}

// POST /api/master-data/schools — 新增学校
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.name || !body.level) {
      return NextResponse.json(
        { error: "缺少必要字段 name/level" },
        { status: 400 }
      );
    }
    const school = await prisma.school.create({
      data: {
        name: body.name,
        district: body.district ?? "南海区",
        town: body.town ?? null,
        level: body.level,
        isKey: body.isKey ?? false,
        keyLevel: body.keyLevel ?? null,
        address: body.address ?? null,
      },
    });
    return NextResponse.json({ data: school }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建失败";
    return NextResponse.json({ error: "创建学校失败", message }, { status: 500 });
  }
}
