"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import SchoolSelector from "@/components/SchoolSelector";
import GradeSelector from "@/components/GradeSelector";
import SubjectTextbookCard from "@/components/SubjectTextbookCard";
import type { School } from "@/app/dashboard/master-data/types";

const DEFAULT_REGION = "南海区";

interface StudentForm {
  name: string;
  gradeId: string;
  schoolId: string;
  parentName: string;
  parentPhone: string;
  parentWechat: string;
  currentScore: string;
  parentGoal: string;
  studentGoal: string;
  personality: string;
  weakness: string;
  summary: string;
}

const EMPTY_FORM: StudentForm = {
  name: "",
  gradeId: "",
  schoolId: "",
  parentName: "",
  parentPhone: "",
  parentWechat: "",
  currentScore: "",
  parentGoal: "",
  studentGoal: "",
  personality: "",
  weakness: "",
  summary: "",
};

export default function NewStudentPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.gradeId) {
      toast.error("请填写学生姓名和年级");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "创建失败");
      toast.success("学生建档成功！");
      router.push(`/dashboard/students/${data.data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSchoolChange = (_schoolId: string, school: School | null) => {
    // 切换学校时清空年级，避免脏数据
    setForm({
      ...form,
      schoolId: school?.id ?? "",
      gradeId: "",
    });
  };

  const handleGradeChange = (gradeId: string) => {
    setForm({ ...form, gradeId });
  };

  return (
    <FormLayout
      form={form}
      loading={loading}
      onChange={handleChange}
      onSchoolChange={handleSchoolChange}
      onGradeChange={handleGradeChange}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}

// 表单整体布局，拆出来避免单函数超 50 行
function FormLayout({
  form,
  loading,
  onChange,
  onSchoolChange,
  onGradeChange,
  onSubmit,
  onCancel,
}: {
  form: StudentForm;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSchoolChange: (schoolId: string, school: School | null) => void;
  onGradeChange: (gradeId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-xl p-6 border border-gray-100";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">新建学生档案</h1>
        <p className="text-sm text-gray-500 mt-1">
          采集学生的基本信息、主观认知和教师诊断
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* 基本信息 */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">① 基本信息</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                学生姓名 <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className={inputClass}
                placeholder="如：张晓明"
                required
              />
            </div>
            <div>
              <label className={labelClass}>当前成绩/排名</label>
              <input
                name="currentScore"
                value={form.currentScore}
                onChange={onChange}
                className={inputClass}
                placeholder="如：班级第10名 / 95分"
              />
            </div>
            <div>
              <label className={labelClass}>所在学校</label>
              <SchoolSelector
                value={form.schoolId}
                onChange={onSchoolChange}
              />
            </div>
            <div>
              <label className={labelClass}>
                年级 <span className="text-red-500">*</span>
              </label>
              <GradeSelector
                schoolId={form.schoolId || undefined}
                value={form.gradeId}
                onChange={onGradeChange}
              />
            </div>
          </div>
        </div>

        {/* 全科+教材版本展示 */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ② 全科与教材版本
          </h2>
          <SubjectTextbookCard
            region={DEFAULT_REGION}
            gradeId={form.gradeId || undefined}
          />
        </div>

        {/* 家长信息 */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">③ 家长信息</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>家长姓名</label>
              <input
                name="parentName"
                value={form.parentName}
                onChange={onChange}
                className={inputClass}
                placeholder="如：李女士"
              />
            </div>
            <div>
              <label className={labelClass}>联系电话</label>
              <input
                name="parentPhone"
                value={form.parentPhone}
                onChange={onChange}
                className={inputClass}
                placeholder="手机号"
              />
            </div>
            <div>
              <label className={labelClass}>微信</label>
              <input
                name="parentWechat"
                value={form.parentWechat}
                onChange={onChange}
                className={inputClass}
                placeholder="微信号/手机号"
              />
            </div>
          </div>
        </div>

        {/* 主观认知 */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">④ 主观认知</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>家长期望</label>
              <textarea
                name="parentGoal"
                value={form.parentGoal}
                onChange={onChange}
                rows={3}
                className={inputClass}
                placeholder="家长对孩子有什么期望？目标学校/分数？"
              />
            </div>
            <div>
              <label className={labelClass}>学生目标</label>
              <textarea
                name="studentGoal"
                value={form.studentGoal}
                onChange={onChange}
                rows={3}
                className={inputClass}
                placeholder="学生自己有什么目标？想考什么学校？"
              />
            </div>
          </div>
        </div>

        {/* 教师诊断 */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⑤ 教师诊断</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>性格特点</label>
              <textarea
                name="personality"
                value={form.personality}
                onChange={onChange}
                rows={2}
                className={inputClass}
                placeholder="学生的性格特点、学习习惯..."
              />
            </div>
            <div>
              <label className={labelClass}>薄弱点诊断</label>
              <textarea
                name="weakness"
                value={form.weakness}
                onChange={onChange}
                rows={3}
                className={inputClass}
                placeholder="学生的薄弱学科/知识点/思维短板..."
              />
            </div>
            <div>
              <label className={labelClass}>学习情况概况</label>
              <textarea
                name="summary"
                value={form.summary}
                onChange={onChange}
                rows={3}
                className={inputClass}
                placeholder="综合分析：优势、不足、建议方向..."
              />
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 transition text-sm font-medium disabled:opacity-50"
          >
            {loading ? "创建中..." : "创建档案"}
          </button>
        </div>
      </form>
    </div>
  );
}
