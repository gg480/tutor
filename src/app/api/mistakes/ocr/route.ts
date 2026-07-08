import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/mistakes/ocr — OCR 识别 + AI 分析错题
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "请提供图片数据" }, { status: 400 });
    }

    // 解码 base64 图片
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // 使用 Tesseract.js 进行 OCR
    let ocrText = "";
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("chi_sim+eng");
      const { data } = await worker.recognize(imageBuffer);
      ocrText = data.text || "";
      await worker.terminate();
    } catch (ocrErr) {
      console.error("OCR 识别失败:", ocrErr);
      return NextResponse.json(
        { error: "OCR 识别失败", message: "图片文字识别失败，请确保图片清晰并包含文字" },
        { status: 422 }
      );
    }

    if (!ocrText.trim()) {
      return NextResponse.json(
        { error: "未识别到文字", message: "图片中未识别到任何文字，请尝试重新拍照" },
        { status: 422 }
      );
    }

    // 清理 OCR 文本，去除多余换行
    const cleanedText = ocrText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // 返回 OCR 结果
    return NextResponse.json({
      data: {
        rawText: cleanedText,
        // 后续可扩展：AI 分析题目、识别学生答案、给出正确答案
      },
      message: `识别到 ${cleanedText.length} 个字符`,
    });
  } catch (err: any) {
    console.error("OCR 接口错误:", err);
    return NextResponse.json(
      { error: "OCR 处理失败", message: err.message },
      { status: 500 }
    );
  }
}
