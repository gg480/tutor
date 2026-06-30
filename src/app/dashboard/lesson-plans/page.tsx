"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import { Brain, Sparkles, BookOpen, Download } from "lucide-react";

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  grade: string;
  objectives: string[];
  keyPoints: string[];
  exercises: { type: string; questions: string[] }[];
  homework: string[];
  aiGenerated: boolean;
  generatedAt: string;
  status?: string;
}

export default function LessonPlansPage() {
  const { status } = useSession();
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [result, setResult] = useState<LessonPlan | null>(null);
  const [form, setForm] = useState({
    subject: "",
    grade: "",
    topic: "",
    duration: "120",
    knowledgePoints: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchPlans();
  }, [status]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/lesson-plans");
      const data = await res.json();
      setPlans(
        (data.data || []).map((p: any) => ({
          ...p,
          objectives: JSON.parse(p.objectives || "[]"),
          keyPoints: JSON.parse(p.keyPoints || "[]"),
          exercises: JSON.parse(p.exercises || "[]"),
          homework: JSON.parse(p.homework || "[]"),
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.grade || !form.topic) {
      toast.error("请填写学科、年级和课题");
      return;
    }

    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: form.subject,
          grade: form.grade,
          topic: form.topic,
          duration: parseInt(form.duration),
          knowledgePoints: form.knowledgePoints
            ? form.knowledgePoints.split(/[,，、]/).map((s: string) => s.trim()).filter(Boolean)
            : [],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      const data = await res.json();
      setResult(data.data);
      toast.success("学案已生成！");
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI学案生成</h1>
          <p className="text-sm text-gray-500 mt-1">
            基于知识点图谱，一键生成结构化教案
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" />
          AI生成学案
        </button>
      </div>

      {/* 生成表单 */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              <Brain className="w-5 h-5 inline mr-2 text-shibu-500" />
              AI 智能学案生成
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学科
                </label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required
                >
                  <option value="">选择学科</option>
                  <option value="数学">数学</option>
                  <option value="物理">物理</option>
                  <option value="英语">英语</option>
                  <option value="语文">语文</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  年级
                </label>
                <select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required
                >
                  <option value="">选择年级</option>
                  {["初一", "初二", "初三", "高一", "高二", "高三"].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  时长
                </label>
                <select
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="45">45 分钟</option>
                  <option value="90">90 分钟</option>
                  <option value="120">120 分钟</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                课题名称
              </label>
              <input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder='如："一元一次方程"、"勾股定理"'
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                涉及知识点（可选，用逗号分隔）
              </label>
              <input
                value={form.knowledgePoints}
                onChange={(e) =>
                  setForm({ ...form, knowledgePoints: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="如：方程定义, 等号性质, 移项法则"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="submit"
                disabled={generating}
                className="flex items-center gap-2 px-6 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 disabled:opacity-50 text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? "生成中..." : "AI 生成学案"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 生成结果 */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 print-area">
          <div className="flex items-center justify-between mb-4 no-print">
            <h2 className="text-lg font-semibold text-gray-900">
              📄 {result.title}
            </h2>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>

          {/* 教学目标 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-shibu-600 mb-2">
              教学目标
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {result.objectives.map((obj, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          {/* 重点难点 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-shibu-600 mb-2">
              重点难点
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {result.keyPoints.map((kp, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {kp}
                </li>
              ))}
            </ul>
          </div>

          {/* 练习题 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-shibu-600 mb-2">
              课堂练习
            </h3>
            {result.exercises.map((section, i) => (
              <div key={i} className="mb-3">
                <p className="text-xs text-gray-500 mb-1">{section.type}</p>
                <ul className="space-y-2">
                  {section.questions.map((q, j) => (
                    <li
                      key={j}
                      className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3"
                    >
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 作业 */}
          <div>
            <h3 className="text-sm font-semibold text-shibu-600 mb-2">
              课后作业
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {result.homework.map((h, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-right text-xs text-gray-400 mt-4 no-print">
            AI生成于 {new Date(result.generatedAt).toLocaleString("zh-CN")}
            · 建议教师审核后使用
          </div>
        </div>
      )}

      {/* 历史学案 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : plans.length === 0 && !result ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>还没有学案</p>
          <p className="text-sm mt-1">点击「AI生成学案」开始备课</p>
        </div>
      ) : plans.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            历史学案
          </h2>
          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{plan.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {plan.subject} · {plan.grade} · AI生成
                  </p>
                </div>
                <button
                  onClick={() => {
                    setResult(plan);
                    setShowForm(false);
                  }}
                  className="text-xs text-shibu-600 hover:text-shibu-700"
                >
                  查看
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
