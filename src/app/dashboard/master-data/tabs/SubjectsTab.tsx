"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { Subject, SUBJECT_CATEGORIES, EXAM_TYPES, APPLICABLE_LEVELS } from "../types";

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  SUBJECT_CATEGORIES.map((c) => [c.value, c.label])
);
const EXAM_LABEL: Record<string, string> = Object.fromEntries(
  EXAM_TYPES.map((e) => [e.value, e.label])
);
const LEVEL_LABEL: Record<string, string> = Object.fromEntries(
  APPLICABLE_LEVELS.map((l) => [l.value, l.label])
);

function parseTypes(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
function joinTypes(arr: string[]): string {
  return arr.join(",");
}

// 学科表单弹窗
function SubjectFormModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: Subject | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    category: initial?.category ?? "basic",
    examTypes: parseTypes(initial?.examTypes ?? ""),
    applicableLevels: parseTypes(initial?.applicableLevels ?? ""),
    isCompetition: initial?.isCompetition ?? false,
  });
  const [submitting, setSubmitting] = useState(false);

  const toggle = (key: "examTypes" | "applicableLevels", v: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(v)
        ? prev[key].filter((x) => x !== v)
        : [...prev[key], v],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name,
        category: form.category,
        examTypes: joinTypes(form.examTypes),
        applicableLevels: joinTypes(form.applicableLevels),
        isCompetition: form.isCompetition,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {initial ? "编辑学科" : "新增学科"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>学科名称 <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass} placeholder="如：数学" required />
            </div>
            <div>
              <label className={labelClass}>学科类别 <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}>
                {SUBJECT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>考试类型</label>
            <div className="flex flex-wrap gap-3 mt-1">
              {EXAM_TYPES.map((e) => (
                <label key={e.value} className="flex items-center gap-1 text-sm text-gray-700">
                  <input type="checkbox" checked={form.examTypes.includes(e.value)}
                    onChange={() => toggle("examTypes", e.value)}
                    className="w-4 h-4 rounded border-gray-300 text-shibu-600 focus:ring-shibu-500" />
                  {e.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>适用学段</label>
            <div className="flex gap-3 mt-1">
              {APPLICABLE_LEVELS.map((l) => (
                <label key={l.value} className="flex items-center gap-1 text-sm text-gray-700">
                  <input type="checkbox" checked={form.applicableLevels.includes(l.value)}
                    onChange={() => toggle("applicableLevels", l.value)}
                    className="w-4 h-4 rounded border-gray-300 text-shibu-600 focus:ring-shibu-500" />
                  {l.label}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isCompetition}
              onChange={(e) => setForm({ ...form, isCompetition: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-shibu-600 focus:ring-shibu-500" />
            竞赛学科
          </label>

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

export default function SubjectsTab() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master-data/subjects");
      const data = await res.json();
      setSubjects(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("加载学科列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      const url = editing ? `/api/master-data/subjects/${editing.id}` : "/api/master-data/subjects";
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
      fetchSubjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`确定要删除学科「${subject.name}」吗？`)) return;
    try {
      const res = await fetch(`/api/master-data/subjects/${subject.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      toast.success("已删除");
      fetchSubjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (s: Subject) => { setEditing(s); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">共 {subjects.length} 个学科</p>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 text-sm">
          <Plus className="w-4 h-4" /> 新增学科
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无学科数据</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-3 py-2 font-medium">名称</th>
                <th className="px-3 py-2 font-medium">类别</th>
                <th className="px-3 py-2 font-medium">考试类型</th>
                <th className="px-3 py-2 font-medium">适用学段</th>
                <th className="px-3 py-2 font-medium">竞赛</th>
                <th className="px-3 py-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-900">{s.name}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{CATEGORY_LABEL[s.category] || s.category}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {parseTypes(s.examTypes).map((t) => EXAM_LABEL[t] || t).join("、") || "-"}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {parseTypes(s.applicableLevels).map((t) => LEVEL_LABEL[t] || t).join("、")}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {s.isCompetition ? (
                      <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">竞赛</span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-shibu-600 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
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
        <SubjectFormModal
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
