import { describe, it, expect, vi, beforeEach } from "vitest";

// mock 依赖
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

// mock prisma：用 vi.hoisted 让引用先于 vi.mock 工厂执行
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    course: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { POST, GET } from "@/app/api/courses/route";
import { createJsonRequest, createGetRequest, parseResponse } from "../helpers/mocks";

describe("POST /api/courses — 排课冲突 + 覆盖", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    prismaMock.course.findFirst.mockReset();
    prismaMock.course.create.mockReset();
    prismaMock.course.delete.mockReset();
    prismaMock.course.findMany.mockReset();
    sessionMock.mockResolvedValue({ user: { id: "u1", name: "Admin" } });
  });

  it("未登录时返回 401", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await POST(createJsonRequest({ studentId: "s1", subject: "数学", startTime: "2026-07-01T10:00:00" }));
    expect(res.status).toBe(401);
  });

  it("无冲突时创建课程成功 → 201", async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);
    prismaMock.course.create.mockResolvedValue({
      id: "new-1",
      studentId: "s1",
      subject: "数学",
      startTime: new Date("2026-07-01T10:00:00"),
      endTime: new Date("2026-07-01T12:00:00"),
      duration: 120,
      student: { id: "s1", name: "张三" },
    });

    const res = await POST(createJsonRequest({
      studentId: "s1",
      subject: "数学",
      startTime: "2026-07-01T10:00:00",
      duration: 120,
    }));
    const { status, json } = await parseResponse(res);

    expect(status).toBe(201);
    expect(json.data.id).toBe("new-1");
    expect(prismaMock.course.create).toHaveBeenCalled();
    // 创建时传入 endTime 已计算
    const createArg = prismaMock.course.create.mock.calls[0][0].data;
    expect(createArg.endTime).toBeInstanceOf(Date);
    expect(createArg.endTime.getTime() - createArg.startTime.getTime()).toBe(120 * 60000);
  });

  it("有冲突且未传 overwrite → 返回 409 + conflict 详情", async () => {
    const conflict = {
      id: "old-1",
      studentId: "s2",
      subject: "英语",
      startTime: new Date("2026-07-01T10:30:00"),
      endTime: new Date("2026-07-01T12:30:00"),
      student: { id: "s2", name: "李四" },
    };
    prismaMock.course.findFirst.mockResolvedValue(conflict);

    const res = await POST(createJsonRequest({
      studentId: "s1",
      subject: "数学",
      startTime: "2026-07-01T10:00:00",
    }));
    const { status, json } = await parseResponse(res);

    expect(status).toBe(409);
    expect(json.error).toBe("排课冲突");
    expect(json.conflict.id).toBe("old-1");
    expect(json.conflict.studentName).toBe("李四");
    expect(json.conflict.subject).toBe("英语");
    expect(json.message).toContain("李四");
    expect(json.message).toContain("英语");
    // 未删除、未创建
    expect(prismaMock.course.delete).not.toHaveBeenCalled();
    expect(prismaMock.course.create).not.toHaveBeenCalled();
  });

  it("有冲突 + overwrite=true + conflictCourseId 匹配 → 删除冲突并创建新课程", async () => {
    const conflict = {
      id: "old-1",
      studentId: "s2",
      subject: "英语",
      startTime: new Date("2026-07-01T10:30:00"),
      endTime: new Date("2026-07-01T12:30:00"),
      student: { id: "s2", name: "李四" },
    };
    prismaMock.course.findFirst.mockResolvedValue(conflict);
    prismaMock.course.delete.mockResolvedValue(conflict);
    prismaMock.course.create.mockResolvedValue({
      id: "new-1",
      studentId: "s1",
      subject: "数学",
      student: { id: "s1", name: "张三" },
    });

    const res = await POST(createJsonRequest({
      studentId: "s1",
      subject: "数学",
      startTime: "2026-07-01T10:00:00",
      overwrite: true,
      conflictCourseId: "old-1",
    }));
    const { status, json } = await parseResponse(res);

    expect(status).toBe(201);
    expect(prismaMock.course.delete).toHaveBeenCalledWith({ where: { id: "old-1" } });
    expect(prismaMock.course.create).toHaveBeenCalled();
    expect(json.data.id).toBe("new-1");
  });

  it("有冲突 + overwrite=true 但 conflictCourseId 不匹配 → 仍返回 409", async () => {
    const conflict = {
      id: "old-1",
      studentId: "s2",
      subject: "英语",
      startTime: new Date("2026-07-01T10:30:00"),
      endTime: new Date("2026-07-01T12:30:00"),
      student: { id: "s2", name: "李四" },
    };
    prismaMock.course.findFirst.mockResolvedValue(conflict);

    const res = await POST(createJsonRequest({
      studentId: "s1",
      subject: "数学",
      startTime: "2026-07-01T10:00:00",
      overwrite: true,
      conflictCourseId: "WRONG-ID", // 不匹配
    }));
    const { status } = await parseResponse(res);

    expect(status).toBe(409);
    expect(prismaMock.course.delete).not.toHaveBeenCalled();
  });

  it("duration 默认 120 分钟", async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);
    prismaMock.course.create.mockResolvedValue({ id: "x", student: { id: "s1", name: "张三" } });

    await POST(createJsonRequest({
      studentId: "s1",
      subject: "数学",
      startTime: "2026-07-01T10:00:00",
      // 不传 duration
    }));

    const createArg = prismaMock.course.create.mock.calls[0][0].data;
    expect(createArg.duration).toBe(120);
  });

  it("prisma.create 抛错 → 返回 400", async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);
    prismaMock.course.create.mockRejectedValue(new Error("DB connection lost"));

    const res = await POST(createJsonRequest({
      studentId: "s1",
      subject: "数学",
      startTime: "2026-07-01T10:00:00",
    }));
    const { status, json } = await parseResponse(res);
    expect(status).toBe(400);
    expect(json.error).toBe("创建课程失败");
  });

  it("冲突检测查询条件包含 status=scheduled + 时间区间重叠", async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);
    prismaMock.course.create.mockResolvedValue({ id: "x", student: { id: "s1", name: "张三" } });

    const start = "2026-07-01T10:00:00";
    await POST(createJsonRequest({
      studentId: "s1",
      subject: "数学",
      startTime: start,
      duration: 90,
    }));

    const where = prismaMock.course.findFirst.mock.calls[0][0].where;
    expect(where.status).toBe("scheduled");
    // startTime < endTime(新) 且 endTime > startTime(新)
    expect(where.startTime.lt).toBeInstanceOf(Date);
    expect(where.endTime.gt).toBeInstanceOf(Date);
  });
});

describe("GET /api/courses", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    prismaMock.course.findMany.mockReset();
    sessionMock.mockResolvedValue({ user: { id: "u1" } });
  });

  it("未登录时返回 401", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await GET(createGetRequest("http://localhost/api/courses"));
    expect(res.status).toBe(401);
  });

  it("today=true → 使用 startOfDay/endOfDay 过滤", async () => {
    prismaMock.course.findMany.mockResolvedValue([]);
    const res = await GET(createGetRequest("http://localhost/api/courses?today=true"));
    const { json } = await parseResponse(res);
    expect(json.total).toBe(0);
    const where = prismaMock.course.findMany.mock.calls[0][0].where;
    expect(where.startTime.gte).toBeInstanceOf(Date);
    expect(where.startTime.lt).toBeInstanceOf(Date);
  });

  it("studentId 参数 → 透传到 where", async () => {
    prismaMock.course.findMany.mockResolvedValue([]);
    await GET(createGetRequest("http://localhost/api/courses?studentId=stu-1"));
    const where = prismaMock.course.findMany.mock.calls[0][0].where;
    expect(where.studentId).toBe("stu-1");
  });

  it("start + end → 时间区间过滤", async () => {
    prismaMock.course.findMany.mockResolvedValue([]);
    await GET(createGetRequest("http://localhost/api/courses?start=2026-07-01T00:00:00&end=2026-07-31T23:59:59"));
    const where = prismaMock.course.findMany.mock.calls[0][0].where;
    expect(where.startTime.gte).toEqual(new Date("2026-07-01T00:00:00"));
    expect(where.startTime.lte).toEqual(new Date("2026-07-31T23:59:59"));
  });
});
