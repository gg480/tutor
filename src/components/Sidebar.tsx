"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import NavSearch from "./NavSearch";
import GlobalSearch from "./GlobalSearch";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  FileText,
  Package,
  Calendar,
  Brain,
  Layers,
  DollarSign,
  Trophy,
  Bell,
  BarChart3,
  UserPlus,
  Settings,
  History,
  CalendarDays,
  GitCommit,
  Rocket,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "工作台", icon: LayoutDashboard },
  { href: "/dashboard/notifications", label: "通知中心", icon: Bell },
  { href: "/dashboard/students", label: "学生管理", icon: Users },
  { href: "/dashboard/courses", label: "排课日历", icon: CalendarCheck },
  { href: "/dashboard/registrations", label: "课程包", icon: Package },
  { href: "/dashboard/finance", label: "业财看板", icon: DollarSign },
  { href: "/dashboard/revenue", label: "月度收入", icon: TrendingUp },
  { href: "/dashboard/trials", label: "试听管理", icon: UserPlus },
  { href: "/dashboard/lesson-plans", label: "AI学案", icon: Brain },
  { href: "/dashboard/knowledge-points", label: "知识点", icon: Layers },
  { href: "/dashboard/records", label: "每日学情", icon: BookOpen },
  { href: "/dashboard/mistakes", label: "错题管理", icon: AlertTriangle },
  { href: "/dashboard/review", label: "错题复习", icon: Brain },
  { href: "/dashboard/scores", label: "成绩曲线", icon: TrendingUp },
  { href: "/dashboard/weekly", label: "学员周报", icon: Calendar },
  { href: "/dashboard/achievements", label: "竞赛成果", icon: Trophy },
  { href: "/dashboard/reports", label: "学习报告", icon: FileText },
  { href: "/dashboard/semester-report", label: "学期总结", icon: FileText },
  { href: "/dashboard/events", label: "学习活动", icon: CalendarDays },
  { href: "/dashboard/system", label: "数据总览", icon: BarChart3 },
  { href: "/dashboard/activity-logs", label: "操作日志", icon: History },
  { href: "/dashboard/settings", label: "系统设置", icon: Settings },
  { href: "/dashboard/onboarding", label: "新手上路", icon: Rocket },
  { href: "/dashboard/changelog", label: "更新日志", icon: GitCommit },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Logo + 搜索 */}
      <div className="px-4 py-4 border-b border-gray-100 space-y-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-shibu-600">拾步</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            OPC
          </span>
        </Link>
        <NavSearch />
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                isActive
                  ? "bg-shibu-50 text-shibu-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 底部用户区 */}
      <div className="p-4 border-t border-gray-100 space-y-1">
        <GlobalSearch />
        <a
          href="/studio"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-500 hover:bg-shibu-50 hover:text-shibu-600 transition"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>品牌主页</span>
        </a>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
