"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Search } from "lucide-react";
import {
  formatDate,
  getMasteryLabel,
  getMasteryColor,
  getMoodLabel,
} from "@/lib/utils";

interface DailyRecord {
  id: string;
  studentId: string;
  date: string;
  teacherNotes: string | null;
  masteryLevel: number;
  mood: string | null;
  nextFocus: string | null;
  homeworkComplete: boolean | null;
  student: { id: string; name: string; grade: string };
  course: { id: string; subject: string } | null;
}

interface Student {
  id: string;
  name: string;
  grade: string;
}

export default function RecordsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">加载中...</div>}>
      <RecordsPageContent />
    </Suspense>
  );
}

function RecordsPageContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterStudent, setFilterStudent] = useState(searchParams?.get("studentId") || "");
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchForm, setBatchForm] = useState({
    studentIds: [] as string[],
    date: new Date().toISOString().split("T")[0],
    teacherNotes: "",
    masteryLevel: "3",
    mood: "normal",
    homeworkComplete: "true",
    nextFocus: "",
  });
  const [form, setForm] = useState({
    studentId: "",
    date: new Date().toISOString().split("T")[0],
    teacherNotes: "",
    masteryLevel: "3",
    mood: "normal",
    homeworkComplete: "true",
    nextFocus: "",
    suggestions: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") {
      fetchRecords();
      fetchStudents();
      // 如果URL中指定了studentId，自动弹窗并预选
      const sid = searchParams?.get("recordFor");
      if (sid) {
        setForm(f => ({ ...f, studentId: sid }));
        setShowNewForm(true);
      }
    }
  }, [status, filterStudent, searchParams]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStudent) params.set("studentId", filterStudent);
      const res = await fetch(`/api/records?${params}`);
      const data = await res.json();
      setRecords(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    if (!form.studentId || !form.teacherNotes) {
      toast.error("请选择学生并填写学情");
      return;
    }

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          masteryLevel: parseInt(form.masteryLevel),
          homeworkComplete: form.homeworkComplete === "true",
          date: new Date(form.date),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      toast.success("学情记录已保存");
      setShowNewForm(false);
      setForm({
        studentId: "",
        date: new Date().toISOString().split("T")[0],
        teacherNotes: "",
        masteryLevel: "3",
        mood: "normal",
        homeworkComplete: "true",
        nextFocus: "",
        suggestions: "",
      });
      fetchRecords();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">每日学情</h1>
          <p className="text-sm text-gray-500 mt-1">
            记录每次课后学生的学习状态
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export?type=records"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            📥 导出CSV
          </a>
          <button
            onClick={() => setShowBatchForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            📋 批量记录
          </button>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> 记录学情
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

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📝</div>
          <p>还没有学情记录</p>
          <p className="text-sm mt-1">点击「记录学情」开始记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-xl p-5 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">
                    {record.student.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {record.student.grade}
                  </span>
                  {record.course && (
                    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded">
                      {record.course.subject}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getMasteryColor(record.masteryLevel)}`}
                  >
                    {getMasteryLabel(record.masteryLevel)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(record.date)}
                  </span>
                </div>
              </div>

              {record.teacherNotes && (
                <p className="text-sm text-gray-700 mb-2">
                  {record.teacherNotes}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-400">
                {record.mood && <span>状态：{getMoodLabel(record.mood)}</span>}
                {record.homeworkComplete !== null && (
                  <span>
                    作业：{record.homeworkComplete ? "✅ 完成" : "❌ 未完成"}
                  </span>
                )}
                {record.nextFocus && (
                  <span>下一步：{record.nextFocus}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新建学情弹窗 */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              记录学情
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
                        {s.name}（{s.grade}）
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日期
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              {/* 快捷模板 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  快捷模板
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { label: "📗 新课顺利", notes: "本节课讲授新知识点，学生理解速度良好，课堂互动积极，基本掌握了核心概念。", mastery: "4", mood: "good" },
                    { label: "📕 复习巩固", notes: "本节课对已学知识点进行复习巩固，通过错题复盘和变式训练，学生对此类题型的掌握度有所提升。", mastery: "3", mood: "normal" },
                    { label: "📘 作业讲解", notes: "针对上周作业中的共性问题进行集中讲解，学生能够理解正确解法，但需要加强独立解题能力。", mastery: "3", mood: "normal" },
                    { label: "📙 竞赛专题", notes: "竞赛专题训练课，学生展现出较好的思维能力，在难题面前不轻易放弃，解题速度有待提升。", mastery: "4", mood: "good" },
                    { label: "📕 状态不佳", notes: "本节课学生学习状态一般，注意力不够集中，基础知识掌握不牢固，建议下节课放缓进度巩固基础。", mastery: "2", mood: "bad" },
                  ].map((template, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          teacherNotes: template.notes,
                          masteryLevel: template.mastery,
                          mood: template.mood,
                        })
                      }
                      className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-shibu-50 hover:border-shibu-300 hover:text-shibu-700 transition"
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  教师观察记录
                </label>
                <textarea
                  value={form.teacherNotes}
                  onChange={(e) =>
                    setForm({ ...form, teacherNotes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  rows={4}
                  placeholder="今天上课的状态如何？哪些知识点掌握得不错，哪些还需要加强？"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    掌握度
                  </label>
                  <select
                    value={form.masteryLevel}
                    onChange={(e) =>
                      setForm({ ...form, masteryLevel: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="1">★ 完全不会</option>
                    <option value="2">★★ 较弱</option>
                    <option value="3">★★★ 一般</option>
                    <option value="4">★★★★ 较好</option>
                    <option value="5">★★★★★ 熟练掌握</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学习状态
                  </label>
                  <select
                    value={form.mood}
                    onChange={(e) =>
                      setForm({ ...form, mood: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="good">状态好</option>
                    <option value="normal">一般</option>
                    <option value="bad">状态差</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    作业完成
                  </label>
                  <select
                    value={form.homeworkComplete}
                    onChange={(e) =>
                      setForm({ ...form, homeworkComplete: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="true">已完成</option>
                    <option value="false">未完成</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  下节课重点
                </label>
                <input
                  value={form.nextFocus}
                  onChange={(e) =>
                    setForm({ ...form, nextFocus: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="下节课需要重点攻克什么？"
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
                  保存记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 批量记录弹窗 */}
      {showBatchForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">批量记录学情</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择学生</label>
                <div className="max-h-32 overflow-y-auto space-y-1.5 border border-gray-200 rounded-lg p-3">
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={batchForm.studentIds.includes(s.id)}
                        onChange={(e) => {
                          setBatchForm({
                            ...batchForm,
                            studentIds: e.target.checked
                              ? [...batchForm.studentIds, s.id]
                              : batchForm.studentIds.filter((id) => id !== s.id),
                          });
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-shibu-600"
                      />
                      {s.name}（{s.grade}）
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">已选择 {batchForm.studentIds.length} 名学生</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input type="date" value={batchForm.date}
                  onChange={(e) => setBatchForm({ ...batchForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学情记录</label>
                <textarea value={batchForm.teacherNotes}
                  onChange={(e) => setBatchForm({ ...batchForm, teacherNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={3}
                  placeholder="所有选中学生的统一学情记录..." />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">掌握度</label>
                  <select value={batchForm.masteryLevel}
                    onChange={(e) => setBatchForm({ ...batchForm, masteryLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} - {["","完全不会","较弱","一般","较好","熟练掌握"][n]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select value={batchForm.mood} onChange={(e) => setBatchForm({ ...batchForm, mood: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="good">状态好</option>
                    <option value="normal">一般</option>
                    <option value="bad">状态差</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">作业</label>
                  <select value={batchForm.homeworkComplete}
                    onChange={(e) => setBatchForm({ ...batchForm, homeworkComplete: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="true">已完成</option>
                    <option value="false">未完成</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowBatchForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
                <button type="button" onClick={async () => {
                  if (batchForm.studentIds.length === 0) { toast.error("请选择学生"); return; }
                  try {
                    const res = await fetch("/api/records/batch", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(batchForm),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    toast.success(data.message || "批量记录成功");
                    setShowBatchForm(false);
                    setBatchForm({ studentIds: [], date: new Date().toISOString().split("T")[0], teacherNotes: "", masteryLevel: "3", mood: "normal", homeworkComplete: "true", nextFocus: "" });
                    fetchRecords();
                  } catch (err: any) { toast.error(err.message); }
                }}
                  className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700">
                  确认批量记录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
