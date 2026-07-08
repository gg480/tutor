"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import ScoreChart from "@/components/ScoreChart";

interface ExamScore {
  id: string;
  studentId: string;
  examName: string;
  examDate: string;
  subject: string;
  score: number;
  totalScore: number;
  ranking: string | null;
  classAverage: number | null;
  examType: string;
  teacherAnalysis: string | null;
  student: { id: string; name: string; grade: { name: string } | null };
}

interface Student {
  id: string;
  name: string;
  gradeName: string;
}

export default function ScoresPage() {
  const { status } = useSession();
  const [scores, setScores] = useState<ExamScore[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterStudent, setFilterStudent] = useState("");
  const [form, setForm] = useState({
    studentId: "",
    examName: "",
    examDate: new Date().toISOString().split("T")[0],
    subject: "",
    score: "",
    totalScore: "100",
    ranking: "",
    classAverage: "",
    examType: "school",
    teacherAnalysis: "",
  });

  const fetchScores = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStudent) params.set("studentId", filterStudent);
      const res = await fetch(`/api/scores?${params}`);
      const data = await res.json();
      setScores(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterStudent]);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") {
      fetchScores();
      fetchStudents();
    }
  }, [status, filterStudent, fetchScores]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students?status=active");
      const data = await res.json();
      setStudents(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.examName || !form.score) {
      toast.error("请填写完整信息");
      return;
    }

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          score: parseFloat(form.score),
          totalScore: parseFloat(form.totalScore),
          classAverage: form.classAverage
            ? parseFloat(form.classAverage)
            : null,
        }),
      });

      if (!res.ok) throw new Error("创建失败");

      toast.success("成绩已记录");
      setShowNewForm(false);
      setForm({
        studentId: "",
        examName: "",
        examDate: new Date().toISOString().split("T")[0],
        subject: "",
        score: "",
        totalScore: "100",
        ranking: "",
        classAverage: "",
        examType: "school",
        teacherAnalysis: "",
      });
      fetchScores();
    } catch (err) {
      toast.error("创建失败");
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成绩曲线</h1>
          <p className="text-sm text-gray-500 mt-1">
            记录考试成绩，追踪学习趋势
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export?type=scores"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            📥 导出CSV
          </a>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> 录入成绩
          </button>
        </div>
      </div>

      {/* 筛选 */}
      <div className="mb-6">
        <select
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">全部学生</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* 成绩趋势图表 — 按学生分组展示 */}
      {!loading && scores.length > 0 && filterStudent && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            成绩趋势
          </h3>
          <ScoreChart scores={scores} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : scores.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📊</div>
          <p>还没有成绩记录</p>
          <p className="text-sm mt-1">点击「录入成绩」开始追踪</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scores.map((score) => {
            const pct = score.score / score.totalScore;
            return (
              <div
                key={score.id}
                className="bg-white rounded-xl p-5 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">
                      {score.student.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {score.student.grade?.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        score.examType === "competition"
                          ? "bg-purple-50 text-purple-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {score.examType === "competition" ? "竞赛" : "校内"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-2xl font-bold ${
                        pct >= 0.85
                          ? "text-green-600"
                          : pct >= 0.6
                          ? "text-shibu-600"
                          : "text-red-600"
                      }`}
                    >
                      {score.score}
                    </span>
                    <span className="text-sm text-gray-400">
                      /{score.totalScore}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-700">{score.examName}</span>
                  <span className="text-gray-400">{score.subject}</span>
                  <span className="text-gray-400">
                    {formatDate(score.examDate)}
                  </span>
                  {score.ranking && (
                    <span className="text-gray-400">排名：{score.ranking}</span>
                  )}
                  {score.classAverage && (
                    <span className="text-gray-400">
                      平均：{score.classAverage}
                    </span>
                  )}
                </div>

                {/* 进度条 */}
                <div className="mt-3 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      pct >= 0.85
                        ? "bg-green-500"
                        : pct >= 0.6
                        ? "bg-shibu-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(pct * 100, 100)}%` }}
                  />
                </div>

                {score.teacherAnalysis && (
                  <p className="text-sm text-gray-600 mt-3">
                    {score.teacherAnalysis}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 新建成绩弹窗 */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              录入成绩
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学生
                  </label>
                  <select
                    value={form.studentId}
                    onChange={(e) =>
                      setForm({ ...form, studentId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    required
                  >
                    <option value="">选择学生</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    考试类型
                  </label>
                  <select
                    value={form.examType}
                    onChange={(e) =>
                      setForm({ ...form, examType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="school">校内考试</option>
                    <option value="competition">竞赛</option>
                    <option value="mock">模拟考</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    考试名称
                  </label>
                  <input
                    value={form.examName}
                    onChange={(e) =>
                      setForm({ ...form, examName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="期中/月考/竞赛"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    科目
                  </label>
                  <input
                    value={form.subject}
                    onChange={(e) =>
                      setForm({ ...form, subject: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="数学"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    得分
                  </label>
                  <input
                    type="number"
                    value={form.score}
                    onChange={(e) =>
                      setForm({ ...form, score: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    满分
                  </label>
                  <input
                    type="number"
                    value={form.totalScore}
                    onChange={(e) =>
                      setForm({ ...form, totalScore: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日期
                  </label>
                  <input
                    type="date"
                    value={form.examDate}
                    onChange={(e) =>
                      setForm({ ...form, examDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排名
                  </label>
                  <input
                    value={form.ranking}
                    onChange={(e) =>
                      setForm({ ...form, ranking: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="班级第5名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    班级平均分
                  </label>
                  <input
                    type="number"
                    value={form.classAverage}
                    onChange={(e) =>
                      setForm({ ...form, classAverage: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  教师分析
                </label>
                <textarea
                  value={form.teacherAnalysis}
                  onChange={(e) =>
                    setForm({ ...form, teacherAnalysis: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  rows={3}
                  placeholder="暴露了哪些问题？后续如何调整？"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm"
                >
                  保存成绩
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
