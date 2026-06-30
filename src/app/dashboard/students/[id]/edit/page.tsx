"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";

interface StudentData {
  name: string;
  grade: string;
  school: string;
  parentName: string;
  parentPhone: string;
  parentWechat: string;
  textbook: string;
  currentScore: string;
  parentGoal: string;
  studentGoal: string;
  personality: string;
  weakness: string;
  summary: string;
  status: string;
}

export default function EditStudentPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StudentData>({
    name: "",
    grade: "",
    school: "",
    parentName: "",
    parentPhone: "",
    parentWechat: "",
    textbook: "",
    currentScore: "",
    parentGoal: "",
    studentGoal: "",
    personality: "",
    weakness: "",
    summary: "",
    status: "active",
  });

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated" && id) fetchStudent();
  }, [authStatus, id]);

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${id}`);
      const data = await res.json();
      const s = data.data;
      setForm({
        name: s.name || "",
        grade: s.grade || "",
        school: s.school || "",
        parentName: s.parentName || "",
        parentPhone: s.parentPhone || "",
        parentWechat: s.parentWechat || "",
        textbook: s.textbook || "",
        currentScore: s.currentScore || "",
        parentGoal: s.parentGoal || "",
        studentGoal: s.studentGoal || "",
        personality: s.personality || "",
        weakness: s.weakness || "",
        summary: s.summary || "",
        status: s.status || "active",
      });
    } catch (err) {
      toast.error("加载学生信息失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.grade) {
      toast.error("请填写学生姓名和年级");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "保存失败");
      }

      toast.success("学生信息已更新！");
      router.push(`/dashboard/students/${id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-xl p-6 border border-gray-100";

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">编辑学生信息</h1>
        <p className="text-sm text-gray-500 mt-1">{form.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ① 基本信息
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                学生姓名 <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                年级 <span className="text-red-500">*</span>
              </label>
              <select
                name="grade"
                value={form.grade}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">选择年级</option>
                {["小四", "小五", "小六", "初一", "初二", "初三", "高一", "高二", "高三"].map(
                  (g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className={labelClass}>所在学校</label>
              <input
                name="school"
                value={form.school}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>状态</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="active">在读</option>
                <option value="paused">暂停</option>
                <option value="ended">已结课</option>
              </select>
            </div>
          </div>
        </div>

        {/* 家长信息 */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ② 家长信息
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>家长姓名</label>
              <input
                name="parentName"
                value={form.parentName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>联系电话</label>
              <input
                name="parentPhone"
                value={form.parentPhone}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>微信</label>
              <input
                name="parentWechat"
                value={form.parentWechat}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* 诊断信息 */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ③ 诊断与目标
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>教材版本</label>
                <input
                  name="textbook"
                  value={form.textbook}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>当前成绩</label>
                <input
                  name="currentScore"
                  value={form.currentScore}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>家长期望</label>
              <textarea
                name="parentGoal"
                value={form.parentGoal}
                onChange={handleChange}
                rows={2}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>学生目标</label>
              <textarea
                name="studentGoal"
                value={form.studentGoal}
                onChange={handleChange}
                rows={2}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>薄弱点诊断</label>
              <textarea
                name="weakness"
                value={form.weakness}
                onChange={handleChange}
                rows={2}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>综合分析</label>
              <textarea
                name="summary"
                value={form.summary}
                onChange={handleChange}
                rows={2}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* 提交 */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 transition text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "保存中..." : "保存修改"}
          </button>
        </div>
      </form>
    </div>
  );
}
