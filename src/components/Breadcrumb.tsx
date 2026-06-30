"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

// 路由 → 中文标签映射
const LABEL_MAP: Record<string, string> = {
  "dashboard": "工作台",
  "notifications": "通知中心",
  "students": "学生管理",
  "courses": "排课日历",
  "registrations": "课程包",
  "finance": "业财看板",
  "revenue": "月度收入",
  "trials": "试听管理",
  "lesson-plans": "AI学案",
  "records": "每日学情",
  "mistakes": "错题管理",
  "review": "错题复习",
  "scores": "成绩曲线",
  "weekly": "学员周报",
  "achievements": "竞赛成果",
  "reports": "学习报告",
  "semester-report": "学期总结",
  "events": "学习活动",
  "system": "数据总览",
  "activity-logs": "操作日志",
  "settings": "系统设置",
  "onboarding": "新手上路",
  "changelog": "更新日志",
  "import": "批量导入",
  "diagnostic": "诊断报告",
  "learning-plan": "双轨制计划",
  "edit": "编辑",
  "mistakes-print": "错题本打印",
  "new": "新建",
};

export default function Breadcrumb() {
  const pathname = usePathname();

  // 跳过根路径和空段
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const items: BreadcrumbItem[] = [];
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = LABEL_MAP[segment] || segment;
    items.push({ label, href: currentPath });
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 no-print" aria-label="面包屑导航">
      <Link href="/dashboard" className="hover:text-shibu-600 transition">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={item.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" />
          {i === items.length - 1 ? (
            <span className="text-gray-600 font-medium">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-shibu-600 transition">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
