import type { StudentTrainingSubject } from "@prisma/client";

// 培训学科状态枚举（spec 仅定义 active 与 ended）
const TRAINING_SUBJECT_STATUSES = ["active", "ended"] as const;

// 培训学科新增输入字段类型（POST）
export type TrainingSubjectInput = {
  subjectId?: string;
  isAtStudio?: unknown;
  startDate?: string;
  endDate?: string | null;
  status?: string;
};

// 培训学科更新输入字段类型（PUT）
export type TrainingSubjectUpdateInput = {
  isAtStudio?: unknown;
  startDate?: string;
  endDate?: string | null;
  status?: string;
};

// 校验培训学科新增输入，返回错误消息（null 表示通过）
export function validateTrainingSubjectInput(
  body: TrainingSubjectInput
): string | null {
  if (!body.subjectId) return "缺少必要字段 subjectId";
  if (!body.startDate) return "缺少必要字段 startDate";
  if (body.isAtStudio !== undefined && typeof body.isAtStudio !== "boolean") {
    return "isAtStudio 必须为布尔值";
  }
  if (
    body.status &&
    !(TRAINING_SUBJECT_STATUSES as readonly string[]).includes(body.status)
  ) {
    return "status 不在合法枚举内";
  }
  return null;
}

// 从已校验的 body 构造 Prisma 新增数据（POST）
// 调用前必须先通过 validateTrainingSubjectInput 校验
export function buildTrainingSubjectData(
  body: TrainingSubjectInput,
  studentId: string
) {
  return {
    studentId,
    subjectId: body.subjectId as string,
    isAtStudio: typeof body.isAtStudio === "boolean" ? body.isAtStudio : true,
    startDate: new Date(body.startDate as string),
    endDate: body.endDate ? new Date(body.endDate) : null,
    status: body.status ?? "active",
  };
}

// 校验培训学科更新输入，返回错误消息（null 表示通过）
export function validateTrainingSubjectUpdate(
  body: TrainingSubjectUpdateInput
): string | null {
  if (body.isAtStudio !== undefined && typeof body.isAtStudio !== "boolean") {
    return "isAtStudio 必须为布尔值";
  }
  if (
    body.status &&
    !(TRAINING_SUBJECT_STATUSES as readonly string[]).includes(body.status)
  ) {
    return "status 不在合法枚举内";
  }
  return null;
}

// 从已校验的 body 构造 Prisma 更新数据（PUT）
// 特殊逻辑：status 改为 "ended" 时，若 endDate 未传，自动设为今日
// 对应 spec 结课场景：用户将 status 改为 ended 时记录 endDate=今日
export function buildTrainingSubjectUpdateData(
  body: TrainingSubjectUpdateInput
) {
  const data: {
    isAtStudio?: boolean;
    startDate?: Date;
    endDate?: Date | null;
    status?: string;
  } = {};
  if (typeof body.isAtStudio === "boolean") data.isAtStudio = body.isAtStudio;
  if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
  if (body.status !== undefined) data.status = body.status;
  // 结课自动补 endDate 为今日；其他情况按 body 实际值
  if (body.status === "ended" && body.endDate === undefined) {
    data.endDate = new Date();
  } else if (body.endDate !== undefined) {
    data.endDate = body.endDate ? new Date(body.endDate) : null;
  }
  return data;
}

// 将记录扁平化为前端使用的结构（含 subjectName）
// 注意：StudentTrainingSubject 无 subject 关系字段，subjectName 由调用方查询后传入
export function mapTrainingSubjectRecord(
  r: StudentTrainingSubject,
  subjectName: string | null
) {
  return {
    id: r.id,
    studentId: r.studentId,
    subjectId: r.subjectId,
    subjectName,
    isAtStudio: r.isAtStudio,
    startDate: r.startDate,
    endDate: r.endDate,
    status: r.status,
  };
}
