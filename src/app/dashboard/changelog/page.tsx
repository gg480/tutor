"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { GitCommit, Rocket, Beaker, Wrench, Sparkles } from "lucide-react";

interface ChangelogEntry {
  round: number;
  title: string;
  items: string[];
  type: "feature" | "test" | "optimize" | "milestone";
}

const CHANGELOG: ChangelogEntry[] = [
  { round: 1, title: "项目初始化 + 核心测试", type: "milestone", items: ["Next.js + Prisma + Tailwind 项目搭建", "Prisma 数据模型（10张表）", "NextAuth 认证系统", "10个 Playwright e2e 测试"] },
  { round: 2, title: "成绩图表 + 课程包管理", type: "feature", items: ["ScoreChart SVG 成绩趋势图", "课程包管理页面（创建/续费）", "课程包 API"] },
  { round: 3, title: "学员周报自动生成", type: "feature", items: ["周报生成 API（自动统计课时/掌握度/错题）", "周报页面 + 打印样式"] },
  { round: 4, title: "学生编辑 + Dashboard 真实数据", type: "feature", items: ["学生信息编辑页面", "Dashboard 聚合 API", "最近动态列表"] },
  { round: 5, title: "测试更新轮 + AI 学案", type: "test", items: ["全量测试文件刷新", "AI 学案生成页面", "学案 API"] },
  { round: 6, title: "错题→同类题推荐", type: "feature", items: ["SimilarProblems 组件", "同类题 API（按错因推荐）", "做对/做错追踪，满3次自动标记掌握"] },
  { round: 7, title: "Dashboard 掌握度趋势", type: "feature", items: ["聚合数据 API（1次请求替代5次）", "14天掌握度趋势柱状图", "掌握度分布图"] },
  { round: 8, title: "家长端 H5 页面", type: "feature", items: ["分享链接生成 API", "公开家长端 H5 页面", "Token 验证"] },
  { round: 9, title: "业财看板", type: "feature", items: ["财务聚合 API", "预收款/已确认收入/负债看板", "续费预警 + 课程包明细表"] },
  { round: 10, title: "测试更新轮 + 排课冲突检测", type: "test", items: ["全量测试刷新", "排课冲突检测（409 冲突）", "废弃文件清理"] },
  { round: 11, title: "全局错误边界 + 签到→学情跳转", type: "optimize", items: ["ErrorBoundary 全局组件", "签到完成自动跳转学情记录"] },
  { round: 12, title: "学情快捷模板", type: "feature", items: ["5个快捷模板（新课/复习/作业/竞赛/状态不佳）", "一键填充掌握度+状态+记录"] },
  { round: 13, title: "竞赛成果管理", type: "feature", items: ["Achievement 模型（5级奖项）", "竞赛成果页面", "学生详情页集成"] },
  { round: 14, title: "通知中心", type: "feature", items: ["通知聚合 API", "今日课程/续费预警/待记录学情三栏布局"] },
  { round: 15, title: "测试更新轮 + API 响应工具", type: "test", items: ["API 统一响应工具库", "签到→学情跳转测试"] },
  { round: 16, title: "学生成长时间线", type: "feature", items: ["StudentTimeline 组件", "聚合9种事件类型", "学生详情页第5个 Tab"] },
  { round: 17, title: "CSV 数据导出", type: "feature", items: ["4种导出类型（学生/学情/错题/成绩）", "导出按钮集成到各页面"] },
  { round: 18, title: "确认对话框组件", type: "feature", items: ["ConfirmDialog 组件", "学生删除保护"] },
  { round: 19, title: "错题本打印版", type: "feature", items: ["错题本打印页面", "按学科分组，自动触发打印"] },
  { round: 20, title: "测试更新轮 + 数据总览", type: "milestone", items: ["全量测试刷新（25个文件）", "SystemStats API", "数据总览页面"] },
  { round: 21, title: "CSV 批量导入学生", type: "feature", items: ["导入 API（预览+确认）", "批量导入页面"] },
  { round: 22, title: "工作室品牌展示页", type: "feature", items: ["公开品牌页面 /studio", "竞赛成果墙", "教学特色展示"] },
  { round: 23, title: "试听管理/销售漏斗", type: "feature", items: ["Trial 模型", "6阶段转化漏斗", "状态推进按钮"] },
  { round: 24, title: "系统设置 + 密码修改", type: "feature", items: ["设置 API", "密码修改表单", "系统信息展示"] },
  { round: 25, title: "测试更新轮", type: "test", items: ["全量测试刷新（30个文件）", "16项导航对齐"] },
  { round: 26, title: "月度收入报表", type: "feature", items: ["收入报表 API", "月度明细表+柱状图"] },
  { round: 27, title: "操作日志全路由集成", type: "feature", items: ["ActivityLog 模型", "12个 API 路由集成日志"] },
  { round: 28, title: "错题复习模式（Flashcard）", type: "feature", items: ["逐题复习卡片", "查看答案/标记掌握", "完成总结面板"] },
  { round: 29, title: "批量排课", type: "feature", items: ["批量排课 API", "星期选择器 + 日期范围"] },
  { round: 30, title: "测试更新轮 + 冒烟测试", type: "milestone", items: ["全量测试刷新", "19页冒烟测试"] },
  { round: 31, title: "导航搜索/命令面板", type: "feature", items: ["NavSearch 组件", "⌘K 快捷键", "关键词搜索19项页面"] },
  { round: 32, title: "骨架屏加载组件", type: "feature", items: ["Skeleton 组件库（4种）", "学生/课程/详情页集成"] },
  { round: 33, title: "操作日志拓展集成", type: "optimize", items: ["更多 API 路由接入日志", "批量排课/学案/周报等"] },
  { round: 34, title: "学习活动管理", type: "feature", items: ["StudyEvent 模型", "自习/竞赛周末/研习会活动页面"] },
  { round: 35, title: "测试更新轮 + 20项导航", type: "test", items: ["全量测试刷新", "20项导航对齐"] },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  feature: Sparkles,
  test: Beaker,
  optimize: Wrench,
  milestone: Rocket,
};

const TYPE_COLORS: Record<string, string> = {
  feature: "bg-blue-50 text-blue-700 border-blue-200",
  test: "bg-purple-50 text-purple-700 border-purple-200",
  optimize: "bg-green-50 text-green-700 border-green-200",
  milestone: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function ChangelogPage() {
  const { status } = useSession();
  if (status === "unauthenticated") redirect("/login");

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <GitCommit className="w-6 h-6 text-shibu-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">版本更新日志</h1>
          <p className="text-sm text-gray-500 mt-1">
            拾步 OPC Tutor Suite · 54轮迭代 · 120轮目标完成 45%
          </p>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "总迭代轮次", value: "54", sub: "/120" },
          { label: "新增功能", value: CHANGELOG.filter((c) => c.type === "feature").length },
          { label: "测试更新", value: CHANGELOG.filter((c) => c.type === "test").length },
          { label: "里程碑", value: CHANGELOG.filter((c) => c.type === "milestone").length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-shibu-600">{stat.value}{stat.sub || ""}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 时间线 */}
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

        {CHANGELOG.map((entry) => {
          const Icon = TYPE_ICONS[entry.type] || GitCommit;
          const colorClass = TYPE_COLORS[entry.type] || TYPE_COLORS.feature;

          return (
            <div key={entry.round} className="relative pl-12 pb-6">
              {/* 图标 */}
              <div className={`absolute left-2 top-0 w-9 h-9 rounded-full flex items-center justify-center border-2 ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* 内容 */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                    R{entry.round}
                  </span>
                  <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${colorClass}`}>
                    {entry.type === "feature" ? "功能" : entry.type === "test" ? "测试" : entry.type === "optimize" ? "优化" : "里程碑"}
                  </span>
                </div>
                <ul className="space-y-1">
                  {entry.items.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-shibu-400 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
