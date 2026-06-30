import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 同类题模板库（按知识点和错因映射）
const SIMILAR_PROBLEMS: Record<string, string[]> = {
  careless: [
    "仔细检查下面的计算：25 × 4 ÷ 25 × 4 = ? （提示：不要被数字迷惑）",
    "判断对错：一个三角形的两个内角分别是30°和60°，这个三角形一定是直角三角形。（  ）",
    "化简：-(-2)³ 的结果是多少？注意符号变化。",
  ],
  concept: [
    "举一个反例说明：\"如果 a > b，那么 a² > b²\" 这个结论不一定成立。",
    "下面哪个选项正确描述了方程 2(x+3)=10 的解法？A.去括号 B.移项 C.合并同类项 D.系数化1",
    "判断：\"两条直线被第三条直线所截，同位角相等\" 这个说法需要什么前提条件？",
  ],
  approach: [
    "用两种不同的方法解方程：2x + 5 = 3x - 1",
    "一题多解：已知一个长方形的周长是20cm，长比宽多2cm，求面积。",
    "变换角度思考：如果题目中的\"多\"改成\"少\"，解法会有什么变化？",
  ],
  unknown: [
    "先回顾概念：什么是一元一次方程？它的标准形式是什么？",
    "基础练习：判断下列哪些是方程：①2+3=5 ②x+2=7 ③2x>5 ④x²=9",
    "分步引导：解方程 3x + 7 = 22，第一步应该做什么？",
  ],
};

// 根据错题内容生成针对性同类题
function generateSimilarProblems(
  errorType: string,
  originalContent: string,
  knowledgePoint?: string
) {
  const templates = SIMILAR_PROBLEMS[errorType] || SIMILAR_PROBLEMS.unknown;
  const problems = templates.map((template, i) => {
    let problem = template;

    // 如果有关联知识点，融入题目
    if (knowledgePoint && i === 0) {
      problem = `【${knowledgePoint}】${problem}`;
    }

    // 如果有原始错题内容，生成一个基于错题的变式
    if (originalContent && i === templates.length - 1) {
      const shortOriginal = originalContent.slice(0, 30);
      problem = `变式练习：参考"${shortOriginal}..."的思路，尝试解决：${problem}`;
    }

    return {
      id: `sim_${i}_${Date.now()}`,
      content: problem,
      hint: getHint(errorType, i),
      difficulty: i === 0 ? "基础" : i === 1 ? "中等" : "挑战",
    };
  });

  return { problems, total: problems.length };
}

function getHint(errorType: string, index: number): string {
  const hints: Record<string, string[]> = {
    careless: [
      "慢慢算，每一步写清楚",
      "画图辅助理解",
      "做完后代入验证",
    ],
    concept: [
      "翻看课本相关定义",
      "举具体数字试试",
      "类比已掌握的知识点",
    ],
    approach: [
      "从问题出发反向推理",
      "尝试画线段图/表格",
      "换个角度思考",
    ],
    unknown: [
      "先看例题再做题",
      "拆解成小步骤",
      "求助老师提示第一步",
    ],
  };
  return (hints[errorType] || hints.unknown)[index] || "仔细审题";
}

// GET /api/mistakes/[id]/similar — 获取同类题推荐
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const mistake = await prisma.mistakeRecord.findUnique({
    where: { id: params.id },
    include: {
      knowledgePoint: { select: { id: true, name: true } },
    },
  });

  if (!mistake) {
    return NextResponse.json({ error: "错题不存在" }, { status: 404 });
  }

  const result = generateSimilarProblems(
    mistake.errorType,
    mistake.originalContent || "",
    mistake.knowledgePoint?.name
  );

  return NextResponse.json({
    data: {
      mistakeId: params.id,
      errorType: mistake.errorType,
      knowledgePoint: mistake.knowledgePoint?.name || "通用",
      ...result,
    },
  });
}

// POST /api/mistakes/[id]/similar — 记录同类题练习结果
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();
    const { correct } = body;

    // 更新correctCount和状态
    const mistake = await prisma.mistakeRecord.findUnique({
      where: { id: params.id },
    });

    if (!mistake) {
      return NextResponse.json({ error: "错题不存在" }, { status: 404 });
    }

    const newCorrectCount = (mistake.correctCount || 0) + (correct ? 1 : 0);

    // 连续做对3次同类题 → 自动标记为已掌握
    const newStatus =
      newCorrectCount >= 3 ? "mastered" : mistake.status === "unsolved" ? "in_progress" : mistake.status;

    const updated = await prisma.mistakeRecord.update({
      where: { id: params.id },
      data: {
        correctCount: newCorrectCount,
        status: newStatus,
        lastReviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      data: updated,
      message:
        newStatus === "mastered"
          ? "🎉 连续做对3次同类题，该知识点已标记为掌握！"
          : correct
          ? `✅ 做对了！已连续做对 ${newCorrectCount}/3 次`
          : "💪 继续加油！再做几次同类题巩固",
    });
  } catch (err: any) {
    return NextResponse.json({ error: "操作失败" }, { status: 400 });
  }
}
