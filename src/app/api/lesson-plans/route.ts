import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// 模拟AI学案生成（无外部API依赖，基于模板+知识库）
function generateLessonPlan(params: {
  subject: string;
  grade: string;
  topic: string;
  knowledgePoints: string[];
  duration: number;
}) {
  const { subject, grade, topic, knowledgePoints, duration } = params;

  const objectives = [
    `理解并掌握 ${topic} 的核心概念`,
    `能够运用 ${topic} 解决 ${grade} 年级典型问题`,
    `培养 ${subject} 学科思维和解题规范`,
  ];

  const keyPoints = knowledgePoints.map((kp) => `重点讲解 ${kp}`);

  // 模拟练习题
  const exercises = [
    {
      type: "基础巩固",
      questions: [
        `【${subject}·${topic}】${grade}年级典型例题1：请根据所学知识解答。`,
        `【${subject}·${topic}】${grade}年级典型例题2：变式训练题。`,
      ],
    },
    {
      type: "能力提升",
      questions: [
        `【${subject}·${topic}】综合应用题：结合${knowledgePoints.slice(0, 2).join("和")}的知识解答。`,
        `【${subject}·${topic}】拓展思考题：尝试用多种方法解答。`,
      ],
    },
  ];

  const homework = [
    `完成基础练习题 ${exercises[0].questions.length} 道`,
    `选做提升题 ${exercises[1].questions.length} 道`,
    `整理本节课的知识点笔记`,
  ];

  return {
    title: `${topic} — ${grade}${subject}学案`,
    subject,
    grade,
    topic,
    duration,
    objectives,
    keyPoints,
    exercises,
    homework,
    aiGenerated: true,
    generatedAt: new Date().toISOString(),
  };
}

// POST /api/lesson-plans/generate — 生成学案
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.subject || !body.grade || !body.topic) {
      return NextResponse.json(
        { error: "缺少必要字段（subject/grade/topic）" },
        { status: 400 }
      );
    }

    // 获取知识点
    const knowledgePoints = body.knowledgePoints?.length
      ? body.knowledgePoints
      : [`${body.topic}基础概念`, `${body.topic}典型题型`, `${body.topic}易错点`];

    // 生成学案内容
    const plan = generateLessonPlan({
      subject: body.subject,
      grade: body.grade,
      topic: body.topic,
      knowledgePoints,
      duration: body.duration || 120,
    });

    // 保存到数据库
    const saved = await prisma.lessonPlan.create({
      data: {
        title: plan.title,
        studentId: body.studentId || null,
        subject: body.subject,
        grade: body.grade,
        knowledgePoints: JSON.stringify(knowledgePoints),
        objectives: JSON.stringify(plan.objectives),
        keyPoints: JSON.stringify(plan.keyPoints),
        exercises: JSON.stringify(plan.exercises),
        homework: JSON.stringify(plan.homework),
        aiGenerated: true,
        aiPrompt: `生成${body.grade}${body.subject}学案，主题：${body.topic}`,
        status: "draft",
      },
    });

    await logActivity({ action: "create", entity: "lessonplan", entityId: saved.id, summary: `AI生成学案：${plan.title}`, userId: session.user?.id });
    return NextResponse.json({
      data: {
        ...plan,
        id: saved.id,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "生成学案失败", message: err.message },
      { status: 400 }
    );
  }
}

// GET /api/lesson-plans — 获取学案列表
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const where: any = {};
  if (studentId) where.studentId = studentId;

  const plans = await prisma.lessonPlan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ data: plans });
}
