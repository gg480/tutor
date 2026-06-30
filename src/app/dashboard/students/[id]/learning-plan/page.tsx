"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

export default function NewLearningPlanPage() {
  const params = useParams();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [studentName, setStudentName] = useState("");
  const [form, setForm] = useState({
    planName: "",
    schoolRatio: "70",
    examRatio: "30",
    totalHours: "",
    price: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  // `useParams()` can return null in Next.js; guard before accessing .id
  if (!params) return null;

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated" && params?.id) fetchStudent();
  }, [authStatus, params?.id]);

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${params.id}`);
      const data = await res.json();
      setStudentName(data.data?.name || "");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.planName) {
      toast.error("请填写计划名称");
      return;
    }

    const schoolRatio = parseInt(form.schoolRatio);
    const examRatio = parseInt(form.examRatio);
    if (schoolRatio + examRatio !== 100) {
      toast.error("校内同步和竞赛拓展占比之和必须为100%");
      return;
    }

    try {
      const res = await fetch("/api/learning-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: params.id,
          planName: form.planName,
          schoolRatio,
          examRatio,
          totalHours: form.totalHours ? parseInt(form.totalHours) : null,
          price: form.price ? parseFloat(form.price) : null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          notes: form.notes,
        }),
      });

      if (!res.ok) throw new Error("创建失败");

      toast.success("双轨制学习计划创建成功！");
      router.push(`/dashboard/students/${params.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRatioChange = (field: "schoolRatio" | "examRatio", value: string) => {
    const num = parseInt(value) || 0;
    if (field === "schoolRatio") {
      setForm({ ...form, schoolRatio: value, examRatio: String(100 - num) });
    } else {
      setForm({ ...form, examRatio: value, schoolRatio: String(100 - num) });
    }
  };

  if (authStatus === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          双轨制学习计划
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {studentName && `为 ${studentName} `}制定校内同步 + 竞赛拓展的个性化方案
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 计划名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              计划名称
            </label>
            <input
              value={form.planName}
              onChange={(e) => setForm({ ...form, planName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder='如："初一数学拔高计划"'
              required
            />
          </div>

          {/* 双轨比例 — 核心差异化 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              双轨比例配置
            </label>
            <div className="bg-gradient-to-r from-shibu-50 via-white to-confidence-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-center gap-6">
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-shibu-600">
                    {form.schoolRatio}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">校内同步</div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.schoolRatio}
                    onChange={(e) =>
                      handleRatioChange("schoolRatio", e.target.value)
                    }
                    className="w-full mt-2 accent-shibu-500"
                  />
                </div>
                <div className="text-gray-300 text-2xl">+</div>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-confidence-500">
                    {form.examRatio}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">竞赛拓展</div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.examRatio}
                    onChange={(e) =>
                      handleRatioChange("examRatio", e.target.value)
                    }
                    className="w-full mt-2 accent-confidence-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                根据学生学习阶段和目标，动态调整两条轨道的权重
              </p>
            </div>
          </div>

          {/* 课程包信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                总课时
              </label>
              <input
                type="number"
                value={form.totalHours}
                onChange={(e) =>
                  setForm({ ...form, totalHours: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="如：48"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                总价（元）
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="如：12800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始日期
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束日期
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              计划说明
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              rows={3}
              placeholder="描述这个学习计划的目标和重点..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700"
            >
              创建计划
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
