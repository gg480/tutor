import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { validateSemester } from "@/lib/score-validation";

// 批量录入单条记录类型
type BatchRecord = {
  subjectId?: string;
  score?: unknown;
  fullScore?: unknown;
  rank?: string;
  note?: string;
};

// 批量录入顶部共用字段类型
type BatchHeader = {
  examName: string;
  examType: string;
  examDate: string;
  semester?: string;
  examRange?: string | null;
};

// 校验批量录入顶部字段，返回错误消息（null 表示通过）
// examType 为用户自定义文本，仅校验非空；examRange 始终可选
function validateBatchHeader(body: {
  examName?: string;
  examType?: string;
  examDate?: string;
  semester?: string;
  examRange?: string | null;
  records?: unknown;
}): string | null {
  if (!body.examName || !body.examType || !body.examDate || !Array.isArray(body.records)) {
    return "缺少必要字段 examName/examType/examDate/records";
  }
  if (body.examType.trim().length === 0) return "examType 不能为空";
  if (!validateSemester(body.semester)) {
    return "semester 取值必须为 first 或 second";
  }
  if ((body.records as unknown[]).length === 0) return "records 不能为空";
  return null;
}

// 校验单条记录字段，返回错误消息（null 表示通过）
function validateBatchRecord(r: BatchRecord): string | null {
  if (!r.subjectId) return "records 中存在缺失 subjectId 的记录";
  if (typeof r.score !== "number") return "records 中存在 score 非数字的记录";
  if (typeof r.fullScore !== "number") return "records 中存在 fullScore 非数字的记录";
  return null;
}

// 事务性批量写入，返回插入条数
async function insertBatchRecords(
  studentId: string,
  header: BatchHeader,
  records: BatchRecord[]
): Promise<number> {
  const examDate = new Date(header.examDate);
  const semester = header.semester ?? "first";
  return prisma.$transaction(async (tx) => {
    let count = 0;
    for (const r of records) {
      await tx.studentSubjectRecord.create({
        data: {
          studentId,
          subjectId: r.subjectId as string,
          score: r.score as number,
          fullScore: r.fullScore as number,
          rank: r.rank ?? null,
          semester,
          examType: header.examType,
          examDate,
          examName: header.examName,
          examRange: header.examRange ?? null,
          note: r.note ?? null,
        },
      });
      count++;
    }
    return count;
  });
}

// POST /api/students/[id]/scores/batch — 批量录入成绩（事务性写入）
// 顶部的 examName/examType/examDate/semester/examRange 所有记录共用
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const headerErr = validateBatchHeader(body);
    if (headerErr) return NextResponse.json({ error: headerErr }, { status: 400 });

    const records = body.records as BatchRecord[];
    for (const r of records) {
      const err = validateBatchRecord(r);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    const inserted = await insertBatchRecords(params.id, body, records);

    await logActivity({
      action: "create",
      entity: "score",
      summary: `批量录入成绩：${body.examName}（${inserted}条）`,
      userId: session.user?.id,
    });

    return NextResponse.json(
      { inserted, total: records.length },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: "批量录入失败", message },
      { status: 500 }
    );
  }
}
