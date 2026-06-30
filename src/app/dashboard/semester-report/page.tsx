"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Printer, Download, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReportData {
  student: { id: string; name: string; grade: string; school: string | null; summary: string | null; createdAt: string };
  period: { start: string; end: string };
  stats: {
    totalCourses: number; totalHours: number; completedCourses: number; completionRate: number;
    totalRecords: number; avgMastery: number; totalMistakes: number; masteredMistakes: number;
    totalScores: number; totalAchievements: number; totalWeeks: number;
    mistakeByType: Record<string, number>;
  };
  charts: { masteryTrend: { month: string; avg: number; count: number }[] };
  scores: any[]; achievements: any[];
  generatedAt: string;
}

const LEVEL_ICONS: Record<string, string> = {
  school: "📋", city: "🏆", provincial: "🥇", national: "🏅", international: "👑",
};

export default function SemesterReportPage() {
  const { status } = useSession();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchStudents();
  }, [status]);

  const fetchStudents = async () => {
    const res = await fetch("/api/students");
    const json = await res.json();
    setStudents(json.data || []);
  };

  const fetchReport = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/semester-report?studentId=${selectedStudent}`);
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudent) fetchReport();
    else setData(null);
  }, [selectedStudent]);

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学期总结报告</h1>
          <p className="text-sm text-gray-500 mt-1">一键生成学生全周期学习报告</p>
        </div>
      </div>

      {/* 选择学生 */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">选择学生</label>
        <div className="flex gap-3">
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">选择学生...</option>
            {students.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}（{s.grade}）</option>
            ))}
          </select>
        </div>
      </div>

      {/* 报告内容 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">生成报告中...</div>
      ) : data ? (
        <div className="print-area">
          {/* 打印/导出按钮 */}
          <div className="no-print flex gap-2 mb-4">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700">
              <Printer className="w-4 h-4" /> 打印/PDF
            </button>
          </div>

          {/* 报告正文 */}
          <div className="bg-white rounded-xl border border-gray-100 p-8">
            {/* 封面 */}
            <div className="text-center mb-8 pb-8 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-shibu-700 mb-2">学期学习报告</h1>
              <p className="text-xl text-gray-800 font-medium">{data.student.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {data.student.grade} · {data.student.school || "个人工作室"}
              </p>
              <p className="text-xs text-gray-400 mt-4">
                报告期间：{data.period.start.slice(0, 10)} ~ {data.period.end.slice(0, 10)}
              </p>
            </div>

            {/* 核心指标 */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "课程数", value: data.stats.totalCourses, sub: `完成${data.stats.completionRate}%` },
                { label: "学时", value: `${data.stats.totalHours}h`, sub: `${data.stats.completedCourses}节完成` },
                { label: "平均掌握度", value: data.stats.avgMastery.toFixed(1), sub: "/5" },
                { label: "错题掌握率", value: data.stats.totalMistakes > 0 ? `${Math.round((data.stats.masteredMistakes / data.stats.totalMistakes) * 100)}%` : "-", sub: `${data.stats.masteredMistakes}/${data.stats.totalMistakes}` },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-shibu-600">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-[10px] text-gray-400">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* 掌握度趋势 */}
            {data.charts.masteryTrend.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">月度掌握度趋势</h2>
                <div className="flex items-end gap-3 h-32">
                  {data.charts.masteryTrend.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-400">{m.avg.toFixed(1)}</span>
                      <div className="w-full bg-shibu-400 rounded-t" style={{ height: `${(m.avg / 5) * 100}%` }} />
                      <span className="text-[10px] text-gray-400">{m.month.slice(5)}月</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 考试成绩 */}
            {data.scores.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">考试成绩</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 text-xs text-gray-400">
                      <th className="text-left py-2">考试</th><th className="text-left py-2">科目</th>
                      <th className="text-right py-2">成绩</th><th className="text-right py-2">日期</th>
                    </tr></thead>
                    <tbody>
                      {data.scores.map((s) => (
                        <tr key={s.id} className="border-b border-gray-50">
                          <td className="py-2 text-gray-700">{s.examName}</td>
                          <td className="py-2 text-gray-500">{s.subject}</td>
                          <td className="py-2 text-right font-medium">{s.score}/{s.totalScore}</td>
                          <td className="py-2 text-right text-gray-400">{formatDate(s.examDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 错题统计 */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">错题统计</h2>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { key: "careless", label: "粗心" },
                  { key: "concept", label: "概念" },
                  { key: "approach", label: "思路" },
                  { key: "unknown", label: "不会" },
                ].map(({ key, label }) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-gray-800">{data.stats.mistakeByType[key] || 0}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 竞赛成果 */}
            {data.achievements.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">竞赛成果</h2>
                <div className="space-y-2">
                  {data.achievements.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 bg-amber-50 rounded-lg p-3">
                      <span className="text-2xl">{LEVEL_ICONS[a.level] || "🏆"}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.awardDate.slice(0, 10)}{a.organization ? ` · ${a.organization}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 数据概览 */}
            <div className="text-xs text-gray-400 border-t border-gray-200 pt-4 mt-8">
              <p>报告生成时间：{new Date(data.generatedAt).toLocaleString("zh-CN")}</p>
              <p>拾步 OPC Tutor Suite · 全周期学习追踪</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
