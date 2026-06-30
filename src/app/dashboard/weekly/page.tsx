"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import { FileText, Send, Printer, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Student {
  id: string;
  name: string;
  grade: string;
}

interface WeeklyReport {
  id: string;
  studentId: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  scoreTrend: string;
  mistakeAnalysis: string;
  nextPlan: string;
  renewalRecommendation: string;
  status: string;
  createdAt: string;
  student: { id: string; name: string; grade: string };
  // 临时字段（来自生成响应）
  teacherComments?: string;
  records?: any[];
}

export default function WeeklyReportPage() {
  const { status } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [nextPlan, setNextPlan] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") {
      fetchStudents();
      fetchReports();
    }
  }, [status]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students?status=active");
      const data = await res.json();
      setStudents(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const params = selectedStudent
        ? `?studentId=${selectedStudent}`
        : "";
      const res = await fetch(`/api/weekly-reports${params}`);
      const data = await res.json();
      setReports(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedStudent]);

  const handleGenerate = async () => {
    if (!selectedStudent) {
      toast.error("请先选择学生");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/weekly-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          nextPlan,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      toast.success("周报已生成！");
      setNextPlan("");
      fetchReports();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学员周报</h1>
          <p className="text-sm text-gray-500 mt-1">
            本周 {format(weekStart, "M月d日", { locale: zhCN })} ~{" "}
            {format(weekEnd, "M月d日", { locale: zhCN })} · 自动生成学情总结
          </p>
        </div>
      </div>

      {/* 选择学生 + 生成 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择学生
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">选择学生...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}（{s.grade}）
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              下周计划（可选）
            </label>
            <input
              value={nextPlan}
              onChange={(e) => setNextPlan(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
              placeholder="如：继续强化一元一次方程应用题"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedStudent}
            className="flex items-center gap-2 px-5 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 disabled:opacity-50 text-sm font-medium"
          >
            <Send className="w-4 h-4" />
            {generating ? "生成中..." : "生成本周周报"}
          </button>
        </div>
      </div>

      {/* 周报列表 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>还没有周报</p>
          <p className="text-sm mt-1">选择学生并点击「生成本周周报」</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const trend = report.scoreTrend
              ? JSON.parse(report.scoreTrend)
              : null;
            const mistakeAnalysis = report.mistakeAnalysis
              ? JSON.parse(report.mistakeAnalysis)
              : null;

            return (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-gray-100 p-6"
              >
                {/* 周报头部 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-shibu-500" />
                    <div>
                      <span className="font-semibold text-gray-900">
                        {report.student.name}
                      </span>
                      <span className="text-sm text-gray-400 ml-2">
                        {report.student.grade}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {report.periodStart
                        ? formatDate(report.periodStart)
                        : ""}{" "}
                      ~ {report.periodEnd ? formatDate(report.periodEnd) : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <Printer className="w-3 h-3" />
                    打印
                  </button>
                </div>

                {/* 周报摘要 */}
                <div className="bg-shibu-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">{report.summary}</p>
                </div>

                {/* 数据卡片 */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {trend && (
                    <>
                      <div className="text-center bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">本周课时</p>
                        <p className="text-xl font-bold text-shibu-600">
                          {trend.totalCourses || 0}
                        </p>
                        <p className="text-xs text-gray-400">
                          {trend.totalHours || 0} 小时
                        </p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">平均掌握度</p>
                        <p className="text-xl font-bold text-shibu-600">
                          {trend.avgMastery || "-"}
                        </p>
                        <p className="text-xs text-gray-400">
                          较上周
                          <span
                            className={
                              trend.masteryTrend === "上升"
                                ? "text-green-500"
                                : trend.masteryTrend === "下降"
                                ? "text-red-500"
                                : "text-gray-500"
                            }
                          >
                            {trend.masteryTrend}
                          </span>
                        </p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">本周错题</p>
                        <p className="text-xl font-bold text-confidence-500">
                          {mistakeAnalysis?.total || 0}
                        </p>
                        <p className="text-xs text-gray-400">
                          新增 {mistakeAnalysis?.total || 0} 题
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* 下周计划 */}
                {report.nextPlan && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500 mb-1">下周计划</p>
                    <p className="text-sm text-gray-700">{report.nextPlan}</p>
                  </div>
                )}

                {/* 续费建议 */}
                {report.renewalRecommendation && (
                  <div className="border-t border-gray-100 pt-3 mt-2">
                    <p className="text-xs text-gray-500 mb-1">续费建议</p>
                    <p className="text-sm text-gray-700">
                      {report.renewalRecommendation}
                    </p>
                  </div>
                )}

                <div className="text-right text-xs text-gray-400 mt-3">
                  生成于 {formatDate(report.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 工具函数
function startOfWeek(date: Date, options?: { weekStartsOn?: number }) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < 1 ? 7 : 0) + day - (options?.weekStartsOn ?? 0);
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date, options?: { weekStartsOn?: number }) {
  const d = startOfWeek(date, options);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}
