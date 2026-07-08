import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/import/students — CSV导入学生
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const { students } = body;

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: "请提供学生数据" }, { status: 400 });
    }

    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (!s.name || !s.gradeId) {
        results.failed++;
        results.errors.push(`第${i + 1}行：缺少姓名或年级ID`);
        continue;
      }

      try {
        await prisma.student.create({
          data: {
            name: s.name,
            gradeId: s.gradeId,
            schoolId: s.schoolId || null,
            parentName: s.parentName || null,
            parentPhone: s.parentPhone || null,
            parentWechat: s.parentWechat || null,
            currentScore: s.currentScore || null,
            parentGoal: s.parentGoal || null,
            studentGoal: s.studentGoal || null,
            personality: s.personality || null,
            weakness: s.weakness || null,
            summary: s.summary || null,
            status: "active",
          },
        });
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`第${i + 1}行（${s.name}）：${err.message}`);
      }
    }

    return NextResponse.json({
      data: results,
      message: `成功导入 ${results.success} 名学生，失败 ${results.failed} 名`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "导入失败", message: err.message },
      { status: 400 }
    );
  }
}

// POST /api/import/preview — 预览CSV数据（解析但不保存）
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const { csvText } = body;

    if (!csvText) {
      return NextResponse.json({ error: "请提供CSV文本" }, { status: 400 });
    }

    // 解析CSV
    const lines: string[] = csvText.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV至少需要标题行+1行数据" }, { status: 400 });
    }

    const headers = lines[0].split(",").map((h: string) => h.trim().replace(/"/g, ""));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || "";
      });
      return row;
    });

    return NextResponse.json({
      data: {
        total: rows.length,
        headers,
        preview: rows.slice(0, 5),
        sample: `姓名,年级ID,学校ID,家长姓名,联系电话,家长微信,当前成绩\n张三,grade-chuyi,school-shiyan,张妈妈,13800138000,zhangmom,班级第15名\n李四,grade-chuer,school-yizhong,李爸爸,13900139000,libaba,班级第8名`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "解析失败", message: err.message }, { status: 400 });
  }
}
