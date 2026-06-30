import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/studio — 公开的工作室数据（无需登录）
export async function GET() {
  try {
    const [
      totalStudents,
      achievements,
      subjectCourses,
    ] = await Promise.all([
      prisma.student.count({ where: { status: "active" } }),
      prisma.achievement.findMany({
        orderBy: { awardDate: "desc" },
        take: 20,
        include: {
          student: { select: { name: true } },
        },
      }),
      prisma.course.groupBy({
        by: ["subject"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    // 按级别统计成果
    const byLevel = {
      school: achievements.filter((a) => a.level === "school").length,
      city: achievements.filter((a) => a.level === "city").length,
      provincial: achievements.filter((a) => a.level === "provincial").length,
      national: achievements.filter((a) => a.level === "national").length,
      international: achievements.filter((a) => a.level === "international").length,
    };

    return NextResponse.json({
      data: {
        stats: {
          totalStudents,
          totalAchievements: achievements.length,
          achievementsByLevel: byLevel,
          subjects: subjectCourses.map((s) => s.subject),
        },
        achievements: achievements.map((a) => ({
          id: a.id,
          title: a.title,
          level: a.level,
          studentName: a.student.name,
          awardDate: a.awardDate.toISOString().slice(0, 10),
          organization: a.organization,
        })),
        studio: {
          name: "拾步工作室",
          slogan: "不是所有工作室，都叫「拾步」",
          description:
            "本地最强、最懂孩子的个人家教工作室。把应试分数和竞赛能力，用最踏实的方式提上去。",
          since: "2026",
          features: [
            { icon: "🎯", title: "精准诊断", desc: "2小时深度学情诊断，定位薄弱点" },
            { icon: "📈", title: "双轨制教学", desc: "校内同步+竞赛拔高，双线并行" },
            { icon: "📊", title: "数据追踪", desc: "全周期学情记录，进步看得见" },
            { icon: "🏆", title: "竞赛培优", desc: "系统性竞赛训练，冲击高级别奖项" },
          ],
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}
