"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { Grade, SCHOOL_LEVELS } from "../types";

const LEVEL_LABEL: Record<string, string> = Object.fromEntries(
  SCHOOL_LEVELS.map((l) => [l.value, l.label])
);

// 将 schoolTypes 逗号字符串与多选状态互转
function parseTypes(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
function joinTypes(arr: string[]): string {
  return arr.join(",");
}

// 年级表单弹窗
function GradeFormModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: Grade | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    level: initial?.level ?? "primary",
    order: initial?.order ?? 0,
    schoolTypes: parseTypes(initial?.schoolTypes ?? "primary"),
  });
  const [submitting, setSubmitting] = useState(false);

  const toggleType = (t: string) => {
    setForm((prev) => ({
      ...prev,
      schoolTypes: prev.schoolTypes.includes(t)
        ? prev.schoolTypes.filter((x) => x !== t)
        : [...prev.schoolTypes, t],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name,
        level: form.level,
        order: form.order,
        schoolTypes: joinTypes(form.schoolTypes),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {initial ? "编辑年级" : "新增年级"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>年级名称 <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass} placeholder="如：初一" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>学段 <span className="text-red-500">*</span></label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                className={inputClass}>
                {SCHOOL_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>排序</label>
              <input type="number" value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>适用学校类型</label>
            <div className="flex gap-3 mt-1">
              {SCHOOL_LEVELS.map((l) => (
                <label key={l.value} className="flex items-center gap-1 text-sm text-gray-700">
                  <input type="checkbox" checked={form.schoolTypes.includes(l.value)}
                    onChange={() => toggleType(l.value)}
                    className="w-4 h-4 rounded border-gray-300 text-shibu-600 focus:ring-shibu-500" />
                  {l.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm disabled:opacity-50">
              {submitting ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GradesTab() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master-data/grades");
      const data = await res.json();
      setGrades(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("加载年级列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      const url = editing ? `/api/master-data/grades/${editing.id}` : "/api/master-data/grades";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "保存失败");
      }
      toast.success(editing ? "已更新" : "已创建");
      setShowForm(false);
      setEditing(null);
      fetchGrades();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    }
  };

  const handleDelete = async (grade: Grade) => {
    if (!confirm(`确定要删除年级「${grade.name}」吗？`)) return;
    try {
      const res = await fetch(`/api/master-data/grades/${grade.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      toast.success("已删除");
      fetchGrades();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (g: Grade) => { setEditing(g); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">共 {grades.length} 个年级</p>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 text-sm">
          <Plus className="w-4 h-4" /> 新增年级
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : grades.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无年级数据</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-3 py-2 font-medium">名称</th>
                <th className="px-3 py-2 font-medium">学段</th>
                <th className="px-3 py-2 font-medium">排序</th>
                <th className="px-3 py-2 font-medium">适用学校类型</th>
                <th className="px-3 py-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-900">{g.name}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{LEVEL_LABEL[g.level] || g.level}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{g.order}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {parseTypes(g.schoolTypes).map((t) => LEVEL_LABEL[t] || t).join("、")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(g)} className="p-1.5 text-gray-400 hover:text-shibu-600 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(g)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <GradeFormModal
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
