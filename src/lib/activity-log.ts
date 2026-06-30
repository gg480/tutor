import { prisma } from "./prisma";

/**
 * 记录操作日志
 * 在关键API路由中调用此函数
 */
export async function logActivity(params: {
  action: "create" | "update" | "delete";
  entity: string;
  entityId?: string;
  summary: string;
  details?: string;
  userId?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        summary: params.summary,
        details: params.details || null,
        userId: params.userId || null,
      },
    });
  } catch (err) {
    // 日志记录失败不应影响主流程
    console.error("记录操作日志失败:", err);
  }
}
