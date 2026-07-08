import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 解析单行 CSV（逗号分隔，去空格）
function parseCsvLine(line: string): string[] {
  return line.split(",").map((f) => f.trim());
}

// 处理单条学校导入，返回是否插入
async function importOneSchool(fields: string[]): Promise<boolean> {
  // 字段顺序：name/district/town/level/isKey/keyLevel/address
  const [name, district, town, level, isKey, keyLevel, address] = fields;
  if (!name || !level) return false;
  // 重复 name+district 跳过
  const exists = await prisma.school.findFirst({
    where: { name, district: district || "南海区" },
  });
  if (exists) return false;
  await prisma.school.create({
    data: {
      name,
      district: district || "南海区",
      town: town || null,
      level,
      isKey: isKey === "true" || isKey === "1",
      keyLevel: keyLevel || null,
      address: address || null,
      source: "manual",
      verified: true,
    },
  });
  return true;
}

// POST /api/master-data/schools/import — CSV 批量导入学校
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = await req.json();
    const text: string = body.text ?? "";
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV 内容为空或仅含表头" },
        { status: 400 }
      );
    }
    // 首行表头跳过
    const dataLines = lines.slice(1);
    let inserted = 0;
    let skipped = 0;
    for (const line of dataLines) {
      const fields = parseCsvLine(line);
      if (fields.length < 4) {
        skipped++;
        continue;
      }
      const ok = await importOneSchool(fields);
      if (ok) inserted++;
      else skipped++;
    }
    return NextResponse.json({ inserted, skipped, total: dataLines.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "导入失败";
    return NextResponse.json({ error: "导入学校失败", message }, { status: 500 });
  }
}
