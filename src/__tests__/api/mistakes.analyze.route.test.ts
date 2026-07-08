import { describe, it, expect, vi, beforeEach } from "vitest";

// mock 依赖：next-auth（getServerSession）+ @/lib/auth（authOptions）
const sessionMock = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => sessionMock(...args),
}));
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { POST } from "@/app/api/mistakes/analyze/route";
import { createJsonRequest, parseResponse } from "../helpers/mocks";

describe("POST /api/mistakes/analyze", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    // 默认已登录
    sessionMock.mockResolvedValue({ user: { id: "u1", name: "Admin" } });
  });

  it("未登录时返回 401", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await POST(createJsonRequest({ text: "题目" }));
    expect(res.status).toBe(401);
  });

  it("未提供 text 时返回 400", async () => {
    const res = await POST(createJsonRequest({}));
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("text 类型非字符串时返回 400", async () => {
    const res = await POST(createJsonRequest({ text: 123 }));
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("纯题目（无答案标记）→ question 含全部文本，confidence 为 low", async () => {
    const text = "某长题目内容\n第二行题目";
    const res = await POST(createJsonRequest({ text, subject: "数学" }));
    const { status, json } = await parseResponse(res);
    expect(status).toBe(200);
    expect(json.data.question).toContain("某长题目内容");
    expect(json.data.studentAnswer).toBe("");
    expect(json.data.correctAnswer).toBe("");
    expect(json.data.confidence).toBe("low");
    // searchQuery 应包含科目
    expect(json.data.searchQuery).toContain("数学");
  });

  it("包含「答案：xxx」标记 → 正确识别 correctAnswer", async () => {
    const text = "题目：2+2=?\n答案：4";
    const res = await POST(createJsonRequest({ text }));
    const { status, json } = await parseResponse(res);
    expect(status).toBe(200);
    expect(json.data.correctAnswer).toBe("4");
    expect(json.data.confidence).toBe("high");
  });

  it("包含「错误答案：xxx」标记 → 识别 studentAnswer（答案行需在错误答案行之前，否则会被 /答案[:：]/ 误匹配）", async () => {
    // 注意：源码 answerMarkers 中 /答案[：:]\s*(.+)/ 未锚定行首，
    // "错误答案：5" 也会被该正则匹配。为避免冲突，把"答案：6"放在前面。
    // [BUG] 已记录到 handover.md：源码此处的正则有歧义，建议加 ^ 或 negative lookbehind
    const text = "题目：3+3=?\n答案：6\n错误答案：5";
    const res = await POST(createJsonRequest({ text }));
    const { status, json } = await parseResponse(res);
    expect(status).toBe(200);
    expect(json.data.studentAnswer).toBe("5");
    expect(json.data.correctAnswer).toBe("6");
  });

  it("[BUG] 错误答案在答案之前时，correctAnswer 会被错误识别为错误答案的值", async () => {
    // 此测试用例记录源码当前行为（已知 bug），不修改源码
    const text = "题目：3+3=?\n错误答案：5\n答案：6";
    const res = await POST(createJsonRequest({ text }));
    const { json } = await parseResponse(res);
    // 源码行为：第一行"错误答案：5"先被 /答案[：:]\s*(.+)/ 匹配 → correctAnswer="5"
    expect(json.data.correctAnswer).toBe("5");
    expect(json.data.studentAnswer).toBe("5");
  });

  it("无 subject 时 searchQuery 仍包含 question 内容", async () => {
    const text = "这是一道题目";
    const res = await POST(createJsonRequest({ text }));
    const { json } = await parseResponse(res);
    expect(json.data.searchQuery).toContain("这是一道题目");
  });

  it("searchQuery 不含换行符", async () => {
    const text = "第一行题目\n第二行题目\n答案：foo";
    const res = await POST(createJsonRequest({ text }));
    const { json } = await parseResponse(res);
    expect(json.data.searchQuery).not.toContain("\n");
  });

  it("「解析：xxx」也能作为正确答案标记", async () => {
    const text = "题目内容\n解析：解题步骤";
    const res = await POST(createJsonRequest({ text }));
    const { json } = await parseResponse(res);
    expect(json.data.correctAnswer).toBe("解题步骤");
  });
});
