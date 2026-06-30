"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { FileText, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  grade: string;
  school: string | null;
  summary: string | null;
  createdAt: string;
  dailyRecords: { id: string; date: string; masteryLevel: number }[];
  mistakeRecords: { id: string; errorType: string; status: string }[];
  examScores: { id: string; examName: string; score: number; totalScore: number; examDate: string }[];
}

export default function ReportsPage() {
  const { status } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchStudents();
  }, [status]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      setStudents(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/students/${id}`);
      const data = await res.json();
      setSelectedStudent(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">学习报告</h1>
        <p className="text-sm text-gray-500 mt-1">
          生成学生学习总结报告
        </p>
      </div>

      {!selectedStudent ? (
        /* 学生列表选择 */
        <div className="space-y-3">
          {students.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>还没有学生数据</p>
            </div>
          ) : (
            students.map((s) => (
              <button
                key={s.id}
                onClick={() => loadStudentDetail(s.id)}
                className="w-full bg-white rounded-xl p-5 border border-gray-100 text-left hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="text-sm text-gray-400 ml-3">
                      {s.grade}
                    </span>
                    {s.school && (
                      <span className="text-sm text-gray-400 ml-3">
                        {s.school}
                      </span>
                    )}
                  </div>
                  <FileText className="w-5 h-5 text-shibu-500" />
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        /* 报告内容 */
        <div>
          {/* 报告头部 */}
          <div className="bg-white rounded-t-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedStudent.name} 学习报告
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedStudent.grade} · {selectedStudent.school || ""} ·
                  建档 {formatDate(selectedStudent.createdAt)}
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-shibu-50 text-shibu-600 rounded-lg hover:bg-shibu-100 text-sm"
              >
                <Download className="w-4 h-4" />
                导出报告
              </button>
            </div>
            <button
              onClick={() => setSelectedStudent(null)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              ← 返回选择学生
            </button>
          </div>

          {/* 报告内容区域 — 学情摘要 */}
          <div className="bg-white border-x border-gray-100 p-6 space-y-6">
            {selectedStudent.summary && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  学情概况
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedStudent.summary}
                </p>
              </div>
            )}

            {/* 最近成绩 */}
            {selectedStudent.examScores?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  最近考试成绩
                </h3>
                <div className="space-y-2">
                  {selectedStudent.examScores.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-sm py-2 border-b border-gray-50"
                    >
                      <span className="text-gray-600">{s.examName}</span>
                      <span className="font-medium">{s.score}/{s.totalScore}</span>
                      <span className="text-gray-400">
                        {formatDate(s.examDate)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 错题统计 */}
            {selectedStudent.mistakeRecords?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  错题统计
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: "careless", label: "粗心" },
                    { key: "concept", label: "概念" },
                    { key: "approach", label: "思路" },
                    { key: "unknown", label: "不会" },
                  ].map(({ key, label }) => {
                    const count = selectedStudent.mistakeRecords.filter(
                      (m) => m.errorType === key
                    ).length;
                    const mastered = selectedStudent.mistakeRecords.filter(
                      (m) => m.errorType === key && m.status === "mastered"
                    ).length;
                    return (
                      <div
                        key={key}
                        className="bg-gray-50 rounded-lg p-3 text-center"
                      >
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-lg font-bold text-gray-700">
                          {count}
                        </p>
                        <p className="text-xs text-green-500">
                          已掌握 {mastered}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 学情记录趋势 */}
            {selectedStudent.dailyRecords?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  掌握度趋势
                </h3>
                <div className="flex items-end gap-2 h-24">
                  {selectedStudent.dailyRecords.slice(0, 14).reverse().map((r, i) => (
                    <div
                      key={r.id}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-full rounded-t ${
                          r.masteryLevel >= 4
                            ? "bg-green-400"
                            : r.masteryLevel >= 3
                            ? "bg-shibu-400"
                            : r.masteryLevel >= 2
                            ? "bg-yellow-400"
                            : "bg-red-400"
                        }`}
                        style={{
                          height: `${(r.masteryLevel / 5) * 100}%`,
                          minHeight: "4px",
                        }}
                      />
                      <span className="text-[10px] text-gray-400">
                        {r.masteryLevel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 结课信息 */}
          <div className="bg-white rounded-b-xl border border-gray-100 p-6 border-t-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              下阶段建议
            </h3>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              rows={4}
              placeholder="输入对学生的下阶段学习建议..."
            />
            <div className="flex justify-end mt-3">
              <button className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700">
                保存建议并生成完整报告
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
