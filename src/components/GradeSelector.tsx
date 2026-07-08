"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Grade } from "@/app/dashboard/master-data/types";

interface GradeSelectorProps {
  schoolId?: string;
  value?: string;
  onChange: (gradeId: string, grade: Grade | null) => void;
  placeholder?: string;
  // 回显时使用：父组件已知的年级名称
  initialGradeName?: string;
}

// 年级联动下拉：schoolId 变化时重新拉取可选年级
export default function GradeSelector({
  schoolId,
  value,
  onChange,
  placeholder = "请选择年级",
  initialGradeName,
}: GradeSelectorProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);
  const disabled = !schoolId;

  // schoolId 变化时拉取年级列表
  useEffect(() => {
    if (!schoolId) {
      setGrades([]);
      return;
    }
    void fetchGrades(schoolId);
  }, [schoolId]);

  const fetchGrades = async (sid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/master-data/schools/${sid}/grades`);
      const data = await res.json();
      setGrades(data.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载年级失败");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gradeId = e.target.value;
    if (!gradeId) {
      onChange("", null);
      return;
    }
    const grade = grades.find((g) => g.id === gradeId) ?? null;
    onChange(gradeId, grade);
  };

  const selectClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";

  // 回显场景：value 不在已加载列表中时（如刚进入 edit 页），仍要展示 initialGradeName
  const hasValueInList = value ? grades.some((g) => g.id === value) : false;
  const showEchoOption = !!value && !hasValueInList && !!initialGradeName;

  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={handleChange}
        disabled={disabled}
        className={selectClass}
      >
        {disabled ? (
          <option value="">请先选择学校</option>
        ) : (
          <>
            <option value="">{loading ? "加载中..." : placeholder}</option>
            {showEchoOption && (
              <option value={value}>{initialGradeName}</option>
            )}
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </>
        )}
      </select>
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-shibu-500 animate-spin" />
      )}
    </div>
  );
}
