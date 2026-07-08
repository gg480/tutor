import { vi } from "vitest";

/**
 * 测试用 mock 工厂
 * 集中管理 prisma / next-auth / tesseract.js / activity-log 的 mock 实现
 * 每个测试用例独立调用以避免状态污染
 */

export interface PrismaCourseMock {
  id: string;
  studentId: string;
  subject: string;
  courseType?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  location?: string | null;
  status: string;
  student: { id: string; name: string; grade?: string };
  attendance?: unknown;
  dailyRecord?: unknown;
}

/** 创建一个 mock 的 prisma 对象，所有方法都是 vi.fn() */
export function createPrismaMock() {
  return {
    course: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    activityLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({
      course: {
        findFirst: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    })),
  };
}

/** 创建一个 mock 的 session 对象 */
export function createSessionMock(overrides: Partial<{ id: string; email: string; name: string; role: string }> = {}) {
  return {
    user: {
      id: overrides.id ?? "user-1",
      email: overrides.email ?? "admin@shibu.com",
      name: overrides.name ?? "Admin",
      role: overrides.role ?? "ADMIN",
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

/** 构造一个 Request 对象，方便 API 测试 */
export function createJsonRequest(body: unknown, init: RequestInit = {}): Request {
  return new Request("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string> || {}) },
    body: JSON.stringify(body),
    ...init,
  });
}

/** 构造一个带 query 的 GET Request */
export function createGetRequest(url: string): Request {
  return new Request(url);
}

/** 解析 NextResponse.json 的辅助函数 */
export async function parseResponse(res: Response) {
  const status = res.status;
  const json = await res.json();
  return { status, json };
}
