import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/mistakes/analyze — AI 分析错题并搜索解法
// 接收 OCR 文本，分析题目内容，识别人工智能/搜索提供正确答案和解法
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const { text, subject } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "请提供待分析的文本" }, { status: 400 });
    }

    // 智能分析题目结构
    const analysis = analyzeProblem(text, subject || "");

    return NextResponse.json({
      data: analysis,
      message: "分析完成",
    });
  } catch (err: any) {
    console.error("分析接口错误:", err);
    return NextResponse.json({ error: "分析失败", message: err.message }, { status: 500 });
  }
}

/**
 * 智能分析题目文本，尝试识别题目、学生答案和正确答案
 * 后续可接入 AI API（如 Claude/OpenAI）来提升准确度
 */
function analyzeProblem(text: string, subject: string) {
  const lines = text.split("\n").filter((l) => l.trim());

  // 尝试识别题目内容（通常是最长或最完整的句子/段落）
  let question = "";
  let studentAnswer = "";
  let correctAnswer = "";
  let explanation = "";

  // 常见模式匹配
  const answerMarkers = [
    /答[：:]\s*(.+)/,
    /答案[：:]\s*(.+)/,
    /解[：:]\s*(.+)/,
    /解答[：:]\s*(.+)/,
    /解析[：:]\s*(.+)/,
    /正确答案[：:]\s*(.+)/,
    /参考答案[：:]\s*(.+)/,
  ];

  const wrongMarkers = [
    /(?:学生|我的|错误|做错).*?答案[：:]\s*(.+)/,
    /(?:学生|我的|错误).*?(?:写|做|填)[了了].*?[：:]\s*(.+)/,
    /错误答案[：:]\s*(.+)/,
  ];

  // 逐行分析
  let foundAnswer = false;
  let foundWrong = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 跳过表头/标记行
    if (/^(题目|问题|试题|第.+题|解[:：]?)$/i.test(line)) {
      question += line + "\n";
      continue;
    }

    // 匹配正确答案
    if (!foundAnswer) {
      for (const marker of answerMarkers) {
        const match = line.match(marker);
        if (match) {
          correctAnswer = match[1].trim();
          foundAnswer = true;
          break;
        }
      }
    }

    // 匹配错误答案
    if (!foundWrong) {
      for (const marker of wrongMarkers) {
        const match = line.match(marker);
        if (match) {
          studentAnswer = match[1].trim();
          foundWrong = true;
          break;
        }
      }
    }

    // 如果既不是答案也不是标记行，作为题目内容
    if (!foundAnswer && !foundWrong) {
      question += line + "\n";
    }
  }

  // 如果没找到答案标记，尝试智能推断
  if (!correctAnswer && !studentAnswer) {
    // 可能是纯题目图片，全部作为题目
    question = text;
  } else if (correctAnswer && !studentAnswer) {
    // 只看到正确答案，可能学生答案也在题目中
    // 尝试从题目中提取
    const possibleWrong = question.match(/[×✗✘Xx]\s*(.+)/);
    if (possibleWrong) {
      studentAnswer = possibleWrong[1].trim();
    }
  }

  // 根据科目生成搜索关键词
  const searchQuery = subject ? `${subject} ${question.slice(0, 100)}` : question.slice(0, 100);

  return {
    question: question.trim(),
    studentAnswer: studentAnswer || "",
    correctAnswer: correctAnswer || "",
    explanation: explanation || "",
    searchQuery: searchQuery.replace(/\n/g, " ").trim(),
    confidence: studentAnswer || correctAnswer ? "high" : "low",
  };
}
