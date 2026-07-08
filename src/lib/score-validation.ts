import type { StudentSubjectRecord } from "@prisma/client";

// 合法学期值
const VALID_SEMESTERS = ["first", "second"] as const;

// 校验学期值是否合法（默认 first）
export function validateSemester(semester: string | undefined): boolean {
  if (!semester) return true; // 缺省时由数据库默认值填充
  return (VALID_SEMESTERS as readonly string[]).includes(semester);
}

// 成绩输入字段类型（POST/PUT 共用）
export type ScoreInput = {
  subjectId?: string;
  score?: unknown;
  fullScore?: unknown;
  semester?: string;
  examType?: string;
  examDate?: string;
  examName?: string;
  examRange?: string | null;
  rank?: string;
  note?: string;
};

// 校验成绩输入字段，返回错误消息（null 表示通过）
// examType 为用户自定义文本（如"周测""月考""期中""期末""中考""竞赛"），仅校验非空
// examRange 始终可选，不再按 examType 强制必填
export function validateScoreInput(body: ScoreInput): string | null {
  if (!body.subjectId) return "缺少必要字段 subjectId";
  if (!body.examName) return "缺少必要字段 examName";
  if (!body.examDate) return "缺少必要字段 examDate";
  if (!body.examType || body.examType.trim().length === 0) {
    return "缺少必要字段 examType";
  }
  if (typeof body.score !== "number") return "score 必须为数字";
  if (typeof body.fullScore !== "number") return "fullScore 必须为数字";
  if (!validateSemester(body.semester)) {
    return "semester 取值必须为 first 或 second";
  }
  return null;
}

// 从已校验的 body 构造 Prisma 写入数据（POST/PUT 共用）
// 调用前必须先通过 validateScoreInput 校验
export function buildScoreData(body: ScoreInput, studentId: string) {
  return {
    studentId,
    subjectId: body.subjectId as string,
    score: body.score as number,
    fullScore: body.fullScore as number,
    rank: body.rank ?? null,
    semester: body.semester ?? "first",
    examType: body.examType as string,
    examDate: new Date(body.examDate as string),
    examName: body.examName as string,
    examRange: body.examRange ?? null,
    note: body.note ?? null,
  };
}

// 将记录扁平化为前端使用的结构（含 subjectName）
// 注意：StudentSubjectRecord 无 subject 关系字段，subjectName 由调用方查询后传入
export function mapScoreRecord(
  r: StudentSubjectRecord,
  subjectName: string | null
) {
  return {
    id: r.id,
    studentId: r.studentId,
    subjectId: r.subjectId,
    subjectName,
    score: r.score,
    fullScore: r.fullScore,
    rank: r.rank,
    semester: r.semester,
    examType: r.examType,
    examDate: r.examDate,
    examName: r.examName,
    examRange: r.examRange,
    note: r.note,
  };
}
