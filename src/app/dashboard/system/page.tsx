"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Users,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Trophy,
  Calendar,
  Activity,
} from "lucide-react";

interface SystemStats {
  totals: {
    students: number;
    activeStudents: number;
    courses: number;
    completedCourses: number;
    records: number;
    mistakes: number;
    masteredMistakes: number;
    scores: number;
    registrations: number;
    activeRegistrations: number;
    achievements: number;
    reports: number;
  };
  thisMonth: {
    newStudents: number;
    newCourses: number;
    newRecords: number;
  };
  weekActivity: {
    courses: number;
    records: number;
    mistakes: number;
  };
  subjectDistribution: { subject: string; count: number }[];
  completionRate: number;
  masteryRate: number;
}

export default function SystemPage() {
  const { status } = useSession();
  const [data, setData] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/system-stats");
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-gray-400">加载失败</div>;

  const { totals, thisMonth, weekActivity, subjectDistribution, completionRate, masteryRate } = data;

  const mainCards = [
    { label: "学生总数", value: totals.students, sub: `在读 ${totals.activeStudents}`, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "课程总数", value: totals.courses, sub: `完成 ${totals.completedCourses}`, icon: BookOpen, color: "bg-green-50 text-green-600" },
    { label: "学情记录", value: totals.records, icon: Activity, color: "bg-purple-50 text-purple-600" },
    { label: "错题总数", value: totals.mistakes, sub: `已掌握 ${totals.masteredMistakes}`, icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
    { label: "考试成绩", value: totals.scores, icon: TrendingUp, color: "bg-cyan-50 text-cyan-600" },
    { label: "竞赛成果", value: totals.achievements, icon: Trophy, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-shibu-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据总览</h1>
          <p className="text-sm text-gray-500 mt-1">全平台运营指标</p>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {mainCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{card.label}</span>
                <div className={`p-1.5 rounded-lg ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              {card.sub && <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 本月新增 */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            <Calendar className="w-4 h-4 inline mr-1" />
            本月新增
          </h2>
          <div className="space-y-3">
            {[
              { label: "新学生", value: thisMonth.newStudents },
              { label: "新课程", value: thisMonth.newCourses },
              { label: "新学情", value: thisMonth.newRecords },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-lg font-bold text-shibu-600">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7日活跃度 */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            <Activity className="w-4 h-4 inline mr-1" />
            近7日活跃
          </h2>
          <div className="space-y-3">
            {[
              { label: "课程", value: weekActivity.courses, pct: totals.courses > 0 ? Math.round((weekActivity.courses / totals.courses) * 100) : 0 },
              { label: "学情", value: weekActivity.records, pct: totals.records > 0 ? Math.round((weekActivity.records / totals.records) * 100) : 0 },
              { label: "错题", value: weekActivity.mistakes, pct: totals.mistakes > 0 ? Math.round((weekActivity.mistakes / totals.mistakes) * 100) : 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5">
                  <div className="bg-shibu-400 h-1.5 rounded-full" style={{ width: `${Math.min(item.pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 完成率 */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">核心完成率</h2>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">课程完成率</p>
              <div className="mt-2 bg-gray-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-shibu-600">{masteryRate}%</p>
              <p className="text-xs text-gray-500 mt-1">错题掌握率</p>
              <div className="mt-2 bg-gray-100 rounded-full h-2">
                <div className="bg-shibu-500 h-2 rounded-full" style={{ width: `${masteryRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 学科分布 */}
      {subjectDistribution.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">学科分布</h2>
          <div className="flex gap-4 flex-wrap">
            {subjectDistribution.map((s) => {
              const maxCount = Math.max(...subjectDistribution.map((x) => x.count));
              const pct = (s.count / maxCount) * 100;
              return (
                <div key={s.subject} className="flex-1 min-w-[80px]">
                  <div className="text-center mb-2">
                    <p className="text-lg font-bold text-gray-900">{s.count}</p>
                    <p className="text-xs text-gray-500">{s.subject}</p>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="bg-shibu-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
