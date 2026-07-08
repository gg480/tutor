"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ChevronRight,
} from "lucide-react";

interface ParentData {
  student: {
    id: string;
    name: string;
    gradeName: string;
    schoolName: string | null;
    parentName: string | null;
    summary: string | null;
    createdAt: string;
  };
  stats: {
    totalRecords: number;
    avgMastery: number;
    totalMistakes: number;
    masteredMistakes: number;
    totalExams: number;
  };
  charts: {
    masteryTrend: { date: string; avg: number }[];
  };
  records: any[];
  mistakes: any[];
  scores: any[];
  weeklyReports: any[];
}

export default function ParentViewPage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/share?token=${token}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "加载失败");
        }
        const json = await res.json();
        setData(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow-sm">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">链接已失效</h1>
          <p className="text-sm text-gray-500">
            {error || "请向老师索取新的分享链接"}
          </p>
        </div>
      </div>
    );
  }

  const { student, stats, charts, records, mistakes, scores, weeklyReports } = data;

  const getBarColor = (avg: number) => {
    if (avg <= 2) return "bg-red-400";
    if (avg <= 3) return "bg-yellow-400";
    if (avg <= 4) return "bg-shibu-400";
    return "bg-green-400";
  };

  const getExamColor = (pct: number) => {
    if (pct >= 0.85) return "text-green-600";
    if (pct >= 0.6) return "text-shibu-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 顶部品牌 */}
      <div className="bg-gradient-to-br from-shibu-700 to-shibu-900 text-white px-5 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold tracking-wider">拾步</span>
            <span className="text-shibu-300 text-xs bg-white/10 px-2 py-0.5 rounded">学情报告</span>
          </div>
          <h1 className="text-2xl font-bold mt-4">{student.name} 的学习报告</h1>
          <p className="text-shibu-200 text-sm mt-1">
            {student.gradeName} · {student.schoolName || "个人工作室"}
            {student.parentName && ` · ${student.parentName}`}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "学情记录", value: stats.totalRecords, icon: BookOpen, color: "bg-purple-100 text-purple-600" },
            { label: "掌握度", value: stats.avgMastery.toFixed(1), icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
            { label: "错题总数", value: stats.totalMistakes, icon: AlertTriangle, color: "bg-orange-100 text-orange-600" },
            { label: "已掌握", value: stats.masteredMistakes, icon: CheckCircle, color: "bg-green-100 text-green-600" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center mx-auto mb-1`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-lg font-bold text-gray-900">{card.value}</p>
                <p className="text-[10px] text-gray-400">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* 本周周报 */}
        {weeklyReports.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-shibu-500" />
              <h2 className="text-sm font-semibold text-gray-700">本周学习总结</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {weeklyReports[0].summary}
            </p>
          </div>
        )}

        {/* 掌握度趋势 */}
        {charts.masteryTrend.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">掌握度趋势</h2>
            <div className="flex items-end gap-1.5 h-24">
              {charts.masteryTrend.map((point, i) => {
                const h = (point.avg / 5) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">{point.avg.toFixed(1)}</span>
                    <div
                      className={`w-full rounded-t ${getBarColor(point.avg)} transition-all`}
                      style={{ height: `${Math.max(h, 4)}%` }}
                    />
                    <span className="text-[9px] text-gray-300">{point.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 近期学情 */}
        {records.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">近期学情</h2>
            <div className="space-y-2">
              {records.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      r.masteryLevel >= 4 ? "bg-green-100 text-green-700" :
                      r.masteryLevel >= 3 ? "bg-blue-100 text-blue-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {r.masteryLevel}
                    </span>
                    <span className="text-gray-600 truncate">{r.teacherNotes?.slice(0, 40) || "无记录"}</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {new Date(r.date).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 错题统计 */}
        {mistakes.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">错题统计</h2>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "careless", label: "粗心", color: "bg-yellow-100 text-yellow-700" },
                { key: "concept", label: "概念", color: "bg-red-100 text-red-700" },
                { key: "approach", label: "思路", color: "bg-blue-100 text-blue-700" },
                { key: "unknown", label: "不会", color: "bg-gray-100 text-gray-700" },
              ].map(({ key, label, color }) => {
                const count = mistakes.filter((m: any) => m.errorType === key).length;
                const mastered = mistakes.filter((m: any) => m.errorType === key && m.status === "mastered").length;
                return (
                  <div key={key} className={`rounded-lg p-3 text-center ${color}`}>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs">{label}</p>
                    <p className="text-[10px] opacity-70">掌握{mastered}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 考试成绩 */}
        {scores.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">考试成绩</h2>
            <div className="space-y-2">
              {scores.slice(0, 5).map((s: any) => {
                const pct = s.score / s.totalScore;
                return (
                  <div key={s.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-gray-700">{s.examName}</span>
                      <span className="text-xs text-gray-400 ml-2">{s.subject}</span>
                    </div>
                    <span className={`font-semibold ${getExamColor(pct)}`}>
                      {s.score}/{s.totalScore}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 为空时的提示 */}
        {records.length === 0 && mistakes.length === 0 && scores.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">还没有学习数据</h2>
            <p className="text-xs text-gray-400">老师记录学情后将在这里展示</p>
          </div>
        )}

        {/* 底部栏 */}
        <div className="text-center pt-4">
          <p className="text-[10px] text-gray-300">
            拾步 OPC Tutor Suite · 数据由老师实时更新
          </p>
        </div>
      </div>
    </div>
  );
}
