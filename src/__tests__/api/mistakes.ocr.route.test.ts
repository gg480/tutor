import { describe, it, expect, vi, beforeEach } from "vitest";

// mock 依赖
const sessionMock = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => sessionMock(...args),
}));
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// mock tesseract.js：动态 import 走 vi.mock
const recognizeMock = vi.fn();
const terminateMock = vi.fn();
vi.mock("tesseract.js", () => ({
  createWorker: vi.fn(async () => ({
    recognize: recognizeMock,
    terminate: terminateMock,
  })),
}));

import { POST } from "@/app/api/mistakes/ocr/route";
import { createJsonRequest, parseResponse } from "../helpers/mocks";

// 1x1 红点 PNG 的 base64 前缀（足够通过类型校验）
const SAMPLE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("POST /api/mistakes/ocr", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    recognizeMock.mockReset();
    terminateMock.mockReset();
    sessionMock.mockResolvedValue({ user: { id: "u1" } });
    terminateMock.mockResolvedValue(undefined);
  });

  it("未登录时返回 401", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await POST(createJsonRequest({ image: SAMPLE_BASE64 }));
    expect(res.status).toBe(401);
  });

  it("未提供 image 时返回 400", async () => {
    const res = await POST(createJsonRequest({}));
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("image 类型非字符串时返回 400", async () => {
    const res = await POST(createJsonRequest({ image: 123 }));
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("OCR 识别成功 → 返回清洗后文本", async () => {
    recognizeMock.mockResolvedValue({
      data: { text: "第一行\n\n\n\n第二行\r\n第三行" },
    });
    const res = await POST(createJsonRequest({ image: SAMPLE_BASE64 }));
    const { status, json } = await parseResponse(res);
    expect(status).toBe(200);
    // \r\n → \n，连续 3+ 换行压缩为 2
    expect(json.data.rawText).toBe("第一行\n\n第二行\n第三行");
    expect(json.message).toContain("识别到");
    expect(terminateMock).toHaveBeenCalled();
  });

  it("OCR 返回空文本 → 返回 422", async () => {
    recognizeMock.mockResolvedValue({ data: { text: "   " } });
    const res = await POST(createJsonRequest({ image: SAMPLE_BASE64 }));
    const { status } = await parseResponse(res);
    expect(status).toBe(422);
  });

  it("OCR 返回空字符串 → 返回 422", async () => {
    recognizeMock.mockResolvedValue({ data: { text: "" } });
    const res = await POST(createJsonRequest({ image: SAMPLE_BASE64 }));
    const { status } = await parseResponse(res);
    expect(status).toBe(422);
  });

  it("tesseract.js 抛错 → 返回 422", async () => {
    recognizeMock.mockRejectedValue(new Error("worker crashed"));
    const res = await POST(createJsonRequest({ image: SAMPLE_BASE64 }));
    const { status, json } = await parseResponse(res);
    expect(status).toBe(422);
    expect(json.error).toContain("OCR 识别失败");
  });

  it("data:image/jpeg;base64, 前缀也能正确解码", async () => {
    recognizeMock.mockResolvedValue({ data: { text: "jpeg 内容" } });
    const jpegB64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP";
    const res = await POST(createJsonRequest({ image: jpegB64 }));
    const { status, json } = await parseResponse(res);
    expect(status).toBe(200);
    expect(json.data.rawText).toBe("jpeg 内容");
  });

  it("正确剥离 data URL 前缀后调用 recognize", async () => {
    recognizeMock.mockResolvedValue({ data: { text: "ok" } });
    await POST(createJsonRequest({ image: SAMPLE_BASE64 }));
    // recognize 第一个参数应为 Buffer
    const arg = recognizeMock.mock.calls[0][0];
    expect(Buffer.isBuffer(arg)).toBe(true);
  });
});
