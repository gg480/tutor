"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { TextbookVersion, Grade, Subject } from "../types";

// 教材版本表单弹窗
function TextbookFormModal({
  initial,
  grades,
  subjects,
  defaultRegion,
  onClose,
  onSubmit,
}: {
  initial: TextbookVersion | null;
  grades: Grade[];
  subjects: Subject[];
  defaultRegion: string;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    region: initial?.region ?? defaultRegion,
    gradeId: initial?.gradeId ?? "",
    subjectId: initial?.subjectId ?? "",
    version: initial?.version ?? "",
    publisher: initial?.publisher ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        publisher: form.publisher || null,
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
          {initial ? "编辑教材版本" : "新增教材版本"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>地区 <span className="text-red-500">*</span></label>
            <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
              className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>年级 <span className="text-red-500">*</span></label>
            <select value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: e.target.value })}
              className={inputClass} required>
              <option value="">请选择年级</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>学科 <span className="text-red-500">*</span></label>
            <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className={inputClass} required>
              <option value="">请选择学科</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>版本 <span className="text-red-500">*</span></label>
            <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })}
              className={inputClass} placeholder="如：人教版" required />
          </div>
          <div>
            <label className={labelClass}>出版社</label>
            <input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })}
              className={inputClass} placeholder="如：人民教育出版社" />
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

export default function TextbooksTab() {
  const [textbooks, setTextbooks] = useState<TextbookVersion[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState("南海区");
  const [gradeFilter, setGradeFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TextbookVersion | null>(null);

  // 加载年级和学科列表（用于下拉和名称映射）
  useEffect(() => {
    (async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          fetch("/api/master-data/grades"),
          fetch("/api/master-data/subjects"),
        ]);
        const gData = await gRes.json();
        const sData = await sRes.json();
        setGrades(gData.data || []);
        setSubjects(sData.data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // 名称映射表
  const gradeNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    grades.forEach((g) => { m[g.id] = g.name; });
    return m;
  }, [grades]);
  const subjectNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    subjects.forEach((s) => { m[s.id] = s.name; });
    return m;
  }, [subjects]);

  const fetchTextbooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (region) params.set("region", region);
      if (gradeFilter) params.set("gradeId", gradeFilter);
      if (subjectFilter) params.set("subjectId", subjectFilter);
      const res = await fetch(`/api/master-data/textbooks?${params}`);
      const data = await res.json();
      setTextbooks(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("加载教材版本失败");
    } finally {
      setLoading(false);
    }
  }, [region, gradeFilter, subjectFilter]);

  useEffect(() => { fetchTextbooks(); }, [fetchTextbooks]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      const url = editing ? `/api/master-data/textbooks/${editing.id}` : "/api/master-data/textbooks";
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
      fetchTextbooks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    }
  };

  const handleDelete = async (tb: TextbookVersion) => {
    if (!confirm(`确定要删除该教材版本（${tb.version}）吗？`)) return;
    try {
      const res = await fetch(`/api/master-data/textbooks/${tb.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      toast.success("已删除");
      fetchTextbooks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (t: TextbookVersion) => { setEditing(t); setShowForm(true); };
  const inputClass = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">共 {textbooks.length} 条教材版本</p>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 text-sm">
          <Plus className="w-4 h-4" /> 新增教材版本
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="地区"
          className={inputClass} />
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className={inputClass}>
          <option value="">全部年级</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className={inputClass}>
          <option value="">全部学科</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : textbooks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无教材版本数据</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-3 py-2 font-medium">地区</th>
                <th className="px-3 py-2 font-medium">年级</th>
                <th className="px-3 py-2 font-medium">学科</th>
                <th className="px-3 py-2 font-medium">版本</th>
                <th className="px-3 py-2 font-medium">出版社</th>
                <th className="px-3 py-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {textbooks.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-900">{t.region}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{gradeNameMap[t.gradeId] || t.gradeId}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{subjectNameMap[t.subjectId] || t.subjectId}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{t.version}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{t.publisher || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-shibu-600 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(t)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
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
        <TextbookFormModal
          initial={editing}
          grades={grades}
          subjects={subjects}
          defaultRegion={region}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
