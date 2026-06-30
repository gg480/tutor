"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Command } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  keywords: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "工作台", href: "/dashboard", keywords: ["首页", "home", "dashboard"] },
  { label: "通知中心", href: "/dashboard/notifications", keywords: ["通知", "提醒", "待办"] },
  { label: "学生管理", href: "/dashboard/students", keywords: ["学生", "学员", "档案"] },
  { label: "排课日历", href: "/dashboard/courses", keywords: ["排课", "课程", "日历", "课表"] },
  { label: "课程包", href: "/dashboard/registrations", keywords: ["课时", "续费", "套餐"] },
  { label: "业财看板", href: "/dashboard/finance", keywords: ["财务", "收入", "预收款"] },
  { label: "月度收入", href: "/dashboard/revenue", keywords: ["月报", "收入", "报表"] },
  { label: "试听管理", href: "/dashboard/trials", keywords: ["试听", "线索", "转化"] },
  { label: "AI学案", href: "/dashboard/lesson-plans", keywords: ["学案", "备课", "教案", "ai"] },
  { label: "每日学情", href: "/dashboard/records", keywords: ["学情", "记录", "反馈"] },
  { label: "错题管理", href: "/dashboard/mistakes", keywords: ["错题", "错因"] },
  { label: "错题复习", href: "/dashboard/review", keywords: ["复习", "回顾", "巩固"] },
  { label: "成绩曲线", href: "/dashboard/scores", keywords: ["成绩", "考试", "分数"] },
  { label: "学员周报", href: "/dashboard/weekly", keywords: ["周报", "总结", "每周"] },
  { label: "竞赛成果", href: "/dashboard/achievements", keywords: ["竞赛", "获奖", "奖状"] },
  { label: "学习报告", href: "/dashboard/reports", keywords: ["报告", "总结"] },
  { label: "数据总览", href: "/dashboard/system", keywords: ["数据", "统计", "总览"] },
  { label: "操作日志", href: "/dashboard/activity-logs", keywords: ["日志", "审计", "记录"] },
  { label: "系统设置", href: "/dashboard/settings", keywords: ["设置", "密码", "配置"] },
];

export default function NavSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 键盘快捷键 Ctrl+K / ⌘K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // 打开时自动聚焦
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const filtered = query
    ? NAV_ITEMS.filter(
        (item) =>
          item.label.includes(query) ||
          item.keywords.some((kw) => kw.includes(query))
      )
    : NAV_ITEMS;

  const handleSelect = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <>
      {/* 搜索触发器 */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-100"
      >
        <Search className="w-3.5 h-3.5" />
        <span>搜索页面...</span>
        <kbd className="ml-auto text-[10px] text-gray-300 bg-white px-1.5 py-0.5 rounded border">
          ⌘K
        </kbd>
      </button>

      {/* 搜索面板 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* 搜索输入 */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索页面..."
                className="flex-1 text-sm outline-none placeholder-gray-300"
              />
              <kbd className="text-[10px] text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded border">
                ESC
              </kbd>
            </div>

            {/* 结果列表 */}
            <div className="max-h-72 overflow-y-auto p-2">
              {filtered.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-shibu-50 hover:text-shibu-700 transition text-left"
                >
                  <span className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs">
                    {item.label[0]}
                  </span>
                  <span>{item.label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{item.href.replace("/dashboard/", "") || "home"}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400">
                  未找到匹配页面
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
