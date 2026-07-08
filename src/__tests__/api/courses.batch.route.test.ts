import { describe, it, expect, vi, beforeEach } from "vitest";

const sessionMock = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => sessionMock(...args),
}));
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));
vi.mock("@/lib/activity-log", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

// batch route 使用 prisma.$transaction(cb)，cb 接收 tx 对象
// 用 vi.hoisted 让 mock 引用先于 vi.mock 工厂执行
const { txMock, prismaMock } = vi.hoisted(() => {
  const txMock = {
    course: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };
  const prismaMock = {
    $transaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock)),
  };
  return { txMock, prismaMock };
});
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { POST } from "@/app/api/courses/batch/route";
import { createJsonRequest, parseResponse } from "../helpers/mocks";

const validBody = {
  studentId: "s1",
  subject: "数学",
  startDate: "2026-07-01",
  endDate: "2026-07-01", // 单日，便于控制
  weekdays: [3], // 2026-07-01 是周三
  time: "14:00",
  duration: 120,
  location: "教室A",
};

describe("POST /api/courses/batch", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    txMock.course.findFirst.mockReset();
    txMock.course.create.mockReset();
    txMock.course.delete.mockReset();
    prismaMock.$transaction.mockClear();
    sessionMock.mockResolvedValue({ user: { id: "u1" } });
  });

  it("未登录时返回 401", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await POST(createJsonRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("缺少必要字段 → 400", async () => {
    const cases = [
      { ...validBody, studentId: "" },
      { ...validBody, subject: "" },
      { ...validBody, startDate: "" },
      { ...validBody, endDate: "" },
      { ...validBody, weekdays: [] },
      { ...validBody, time: "" },
    ];
    for (const body of cases) {
      const res = await POST(createJsonRequest(body));
      const { status } = await parseResponse(res);
      expect(status).toBe(400);
    }
  });

  it("无冲突 → 创建一节课", async () => {
    txMock.course.findFirst.mockResolvedValue(null);
    txMock.course.create.mockResolvedValue({ id: "c1", student: { name: "张三" } });

    const res = await POST(createJsonRequest(validBody));
    const { status, json } = await parseResponse(res);

    expect(status).toBe(200);
    expect(json.data.created).toBe(1);
    expect(json.data.failed).toBe(0);
    expect(txMock.course.create).toHaveBeenCalledTimes(1);
    const createArg = txMock.course.create.mock.calls[0][0].data;
    expect(createArg.studentId).toBe("s1");
    expect(createArg.subject).toBe("数学");
    expect(createArg.location).toBe("教室A");
    expect(createArg.status).toBe("scheduled");
  });

  it("有冲突 + 未传 overwrite → 计入 errors，不创建", async () => {
    txMock.course.findFirst.mockResolvedValue({
      id: "old-1",
      student: { name: "李四" },
    });

    const res = await POST(createJsonRequest(validBody));
    const { status, json } = await parseResponse(res);

    expect(status).toBe(200);
    expect(json.data.created).toBe(0);
    expect(json.data.failed).toBe(1);
    expect(json.data.errors[0]).toContain("李四");
    expect(txMock.course.create).not.toHaveBeenCalled();
    expect(txMock.course.delete).not.toHaveBeenCalled();
  });

  it("有冲突 + overwrite=true + conflictCourseIds 包含冲突 id → 删除并重建", async () => {
    txMock.course.findFirst.mockResolvedValue({
      id: "old-1",
      student: { name: "李四" },
    });
    txMock.course.delete.mockResolvedValue({});
    txMock.course.create.mockResolvedValue({ id: "new-1", student: { name: "张三" } });

    const res = await POST(createJsonRequest({
      ...validBody,
      overwrite: true,
      conflictCourseIds: ["old-1"],
    }));
    const { status, json } = await parseResponse(res);

    expect(status).toBe(200);
    expect(json.data.created).toBe(1);
    expect(json.data.failed).toBe(0);
    expect(txMock.course.delete).toHaveBeenCalledWith({ where: { id: "old-1" } });
    expect(txMock.course.create).toHaveBeenCalledTimes(1);
  });

  it("有冲突 + overwrite=true 但 conflictCourseIds 不包含 → 计入 errors", async () => {
    txMock.course.findFirst.mockResolvedValue({
      id: "old-1",
      student: { name: "李四" },
    });

    const res = await POST(createJsonRequest({
      ...validBody,
      overwrite: true,
      conflictCourseIds: ["OTHER-ID"], // 不匹配
    }));
    const { status, json } = await parseResponse(res);

    expect(status).toBe(200);
    expect(json.data.created).toBe(0);
    expect(json.data.failed).toBe(1);
    expect(txMock.course.delete).not.toHaveBeenCalled();
  });

  it("course.create 抛错 → 单日失败计入 errors，事务不中断", async () => {
    txMock.course.findFirst.mockResolvedValue(null);
    txMock.course.create.mockRejectedValue(new Error("DB error"));

    const res = await POST(createJsonRequest(validBody));
    const { status, json } = await parseResponse(res);

    expect(status).toBe(200);
    expect(json.data.created).toBe(0);
    expect(json.data.failed).toBe(1);
    expect(json.data.errors[0]).toContain("创建失败");
  });

  it("多天排课 + 部分有冲突 → 成功与失败混合返回", async () => {
    // 7-01(周三) 和 7-08(周三) 两天，其中 7-01 冲突
    txMock.course.findFirst
      .mockResolvedValueOnce({ id: "old-1", student: { name: "李四" } })
      .mockResolvedValueOnce(null);
    txMock.course.create.mockResolvedValue({ id: "c2", student: { name: "张三" } });

    const res = await POST(createJsonRequest({
      ...validBody,
      startDate: "2026-07-01",
      endDate: "2026-07-08",
    }));
    const { status, json } = await parseResponse(res);

    expect(status).toBe(200);
    expect(json.data.created).toBe(1);
    expect(json.data.failed).toBe(1);
  });

  it("courseType 默认 normal", async () => {
    txMock.course.findFirst.mockResolvedValue(null);
    txMock.course.create.mockResolvedValue({ id: "c1", student: { name: "张三" } });

    await POST(createJsonRequest(validBody));
    const createArg = txMock.course.create.mock.calls[0][0].data;
    expect(createArg.courseType).toBe("normal");
  });

  it("duration 默认 120", async () => {
    txMock.course.findFirst.mockResolvedValue(null);
    txMock.course.create.mockResolvedValue({ id: "c1", student: { name: "张三" } });

    const { duration: _omit, ...bodyNoDuration } = validBody;
    await POST(createJsonRequest(bodyNoDuration));
    const createArg = txMock.course.create.mock.calls[0][0].data;
    expect(createArg.duration).toBe(120);
  });

  it("location 缺省时为 null", async () => {
    txMock.course.findFirst.mockResolvedValue(null);
    txMock.course.create.mockResolvedValue({ id: "c1", student: { name: "张三" } });

    const { location: _omit, ...bodyNoLocation } = validBody;
    await POST(createJsonRequest(bodyNoLocation));
    const createArg = txMock.course.create.mock.calls[0][0].data;
    expect(createArg.location).toBeNull();
  });

  it("正确解析 time（HH:MM）到 startTime 的 hours/minutes", async () => {
    txMock.course.findFirst.mockResolvedValue(null);
    txMock.course.create.mockResolvedValue({ id: "c1", student: { name: "张三" } });

    await POST(createJsonRequest({ ...validBody, time: "09:30" }));
    const createArg = txMock.course.create.mock.calls[0][0].data;
    expect(createArg.startTime.getHours()).toBe(9);
    expect(createArg.startTime.getMinutes()).toBe(30);
  });

  it("weekdays 用 1-7（7=周日），周二=2 命中 2026-07-07", async () => {
    txMock.course.findFirst.mockResolvedValue(null);
    txMock.course.create.mockResolvedValue({ id: "c1", student: { name: "张三" } });

    // 2026-07-06 周一, 2026-07-07 周二
    await POST(createJsonRequest({
      ...validBody,
      startDate: "2026-07-06",
      endDate: "2026-07-07",
      weekdays: [2], // 只排周二
    }));

    expect(txMock.course.create).toHaveBeenCalledTimes(1);
    const createArg = txMock.course.create.mock.calls[0][0].data;
    // 周二 = 7月7日
    expect(createArg.startTime.getDate()).toBe(7);
  });

  it("weekdays=7 命中周日（2026-07-05 是周日）", async () => {
    txMock.course.findFirst.mockResolvedValue(null);
    txMock.course.create.mockResolvedValue({ id: "c1", student: { name: "张三" } });

    await POST(createJsonRequest({
      ...validBody,
      startDate: "2026-07-04", // 周六
      endDate: "2026-07-05",   // 周日
      weekdays: [7],           // 周日
    }));

    expect(txMock.course.create).toHaveBeenCalledTimes(1);
    const createArg = txMock.course.create.mock.calls[0][0].data;
    expect(createArg.startTime.getDate()).toBe(5);
  });
});
