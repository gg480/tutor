"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Users,
  CalendarCheck,
  BookOpen,
  AlertTriangle,
  FileText,
  TrendingUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DashboardData {
  stats: {
    activeStudents: number;
    todayCourses: number;
    pendingMistakes: number;
    totalMistakes: number;
    totalRecords: number;
    weeklyReports: number;
    totalScores: number;
  };
  charts: {
    masteryTrend: { date: string; avgMastery: number; count: number }[];
    masteryDistribution: number[];
    recentScores: any[];
  };
  recentActivity: { type: string; text: string; date: string; detail: string }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchDashboard();
  }, [status]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error("加载失败", err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" />
      </div>
    );
  }

  const stats = data?.stats;
  const charts = data?.charts;

  const cards = [
    { label: "在读学生", value: stats?.activeStudents || 0, icon: Users, color: "bg-blue-50 text-blue-600", href: "/dashboard/students" },
    { label: "今日课程", value: stats?.todayCourses || 0, icon: CalendarCheck, color: "bg-green-50 text-green-600", href: "/dashboard/courses" },
    { label: "待处理错题", value: stats?.pendingMistakes || 0, icon: AlertTriangle, color: "bg-orange-50 text-orange-600", href: "/dashboard/mistakes" },
    { label: "学情记录", value: stats?.totalRecords || 0, icon: BookOpen, color: "bg-purple-50 text-purple-600", href: "/dashboard/records" },
    { label: "本周周报", value: stats?.weeklyReports || 0, icon: FileText, color: "bg-shibu-50 text-shibu-600", href: "/dashboard/weekly" },
  ];

  const getBarColor = (level: number) => {
    if (level <= 1) return "bg-red-400";
    if (level <= 2) return "bg-orange-400";
    if (level <= 3) return "bg-yellow-400";
    if (level <= 4) return "bg-shibu-400";
    return "bg-green-400";
  };

  const getMasteryLabel = (level: number) => {
    return ["", "完全不会", "较弱", "一般", "较好", "熟练掌握"][level] || "";
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          欢迎回来{session?.user?.name ? `，${session.user.name}` : ""}
        </h1>
        <p className="text-gray-500 mt-1">今天也是踏实向上的一天</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <a key={card.label} href={card.href} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 掌握度趋势图 */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">掌握度趋势（近14天）</h2>
            {(charts?.masteryTrend?.length || 0) > 0 && (
              <span className="text-xs text-gray-400">
                平均 {charts!.masteryTrend!.reduce((s, d) => s + d.avgMastery, 0) / charts!.masteryTrend!.length}/5
              </span>
            )}
          </div>
          {charts?.masteryTrend && charts.masteryTrend.length > 0 ? (
            <div className="flex items-end gap-1.5 h-32">
              {charts.masteryTrend.map((point, i) => {
                const heightPct = (point.avgMastery / 5) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">{point.avgMastery.toFixed(1)}</span>
                    <div
                      className={`w-full rounded-t ${getBarColor(Math.round(point.avgMastery))}`}
                      style={{ height: `${heightPct}%`, minHeight: "4px", maxHeight: "100%" }}
                      title={`${point.date}: ${point.avgMastery}/5 (${point.count}条记录)`}
                    />
                    <span className="text-[9px] text-gray-300 -rotate-45 origin-left">
                      {point.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-gray-400">
              暂无掌握度数据
            </div>
          )}
        </div>

        {/* 掌握度分布 */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">掌握度分布</h2>
          {charts?.masteryDistribution && charts.masteryDistribution.some(v => v > 0) ? (
            <div className="space-y-3">
              {charts.masteryDistribution.map((count, i) => {
                const level = i + 1;
                const total = charts.masteryDistribution.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                if (count === 0) return null;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16 text-right">
                      {getMasteryLabel(level)}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5">
                      <div
                        className={`h-5 rounded-full ${getBarColor(level)} transition-all`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-10">{count}条</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-gray-400">
              暂无学情记录
            </div>
          )}
        </div>
      </div>

      {/* 快捷操作 + 最近动态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">快捷操作</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/dashboard/students/new" className="p-3 rounded-lg bg-shibu-50 text-shibu-700 hover:bg-shibu-100 text-sm font-medium text-center">+ 新建学生</a>
            <a href="/dashboard/courses" className="p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium text-center">+ 添加课程</a>
            <a href="/dashboard/records" className="p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-sm font-medium text-center">📝 记学情</a>
            <a href="/dashboard/mistakes" className="p-3 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 text-sm font-medium text-center">📸 录错题</a>
            <a href="/dashboard/weekly" className="p-3 rounded-lg bg-shibu-50 text-shibu-700 hover:bg-shibu-100 text-sm font-medium text-center col-span-2">📋 生成周报</a>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">最近动态</h2>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span>{item.type === "record" ? "📝" : "📸"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 truncate">{item.text}</p>
                    {item.detail && <p className="text-gray-400 text-xs truncate">{item.detail}</p>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(item.date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-gray-400">暂无动态</div>
          )}
        </div>
      </div>
    </div>
  );
}
