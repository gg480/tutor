"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Search, Trash2, Pencil, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { School, SCHOOL_LEVELS } from "../types";

const LEVEL_LABEL: Record<string, string> = Object.fromEntries(
  SCHOOL_LEVELS.map((l) => [l.value, l.label])
);

// 学校表单弹窗
function SchoolFormModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: School | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    district: initial?.district ?? "南海区",
    town: initial?.town ?? "",
    level: initial?.level ?? "primary",
    isKey: initial?.isKey ?? false,
    keyLevel: initial?.keyLevel ?? "",
    address: initial?.address ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        town: form.town || null,
        keyLevel: form.keyLevel || null,
        address: form.address || null,
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
          {initial ? "编辑学校" : "新增学校"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>学校名称 <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass} placeholder="如：石门中学" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>区/县</label>
              <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>镇街</label>
              <input value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })}
                className={inputClass} placeholder="如：桂城" />
            </div>
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
              <label className={labelClass}>重点等级</label>
              <input value={form.keyLevel} onChange={(e) => setForm({ ...form, keyLevel: e.target.value })}
                className={inputClass} placeholder="如：国家级示范性" />
            </div>
          </div>
          <div>
            <label className={labelClass}>地址</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isKey}
              onChange={(e) => setForm({ ...form, isKey: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-shibu-600 focus:ring-shibu-500" />
            重点学校
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

// 单行学校记录
function SchoolRow({
  school,
  onEdit,
  onDelete,
}: {
  school: School;
  onEdit: (s: School) => void;
  onDelete: (s: School) => void;
}) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50">
      <td className="px-3 py-2 text-sm text-gray-900">{school.name}</td>
      <td className="px-3 py-2 text-sm text-gray-600">{school.district}</td>
      <td className="px-3 py-2 text-sm text-gray-600">{school.town || "-"}</td>
      <td className="px-3 py-2 text-sm text-gray-600">{LEVEL_LABEL[school.level] || school.level}</td>
      <td className="px-3 py-2 text-sm">
        {school.isKey ? (
          <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">重点</span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-gray-600">{school.keyLevel || "-"}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex gap-1 justify-end">
          <button onClick={() => onEdit(school)} className="p-1.5 text-gray-400 hover:text-shibu-600 rounded">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(school)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function SchoolsTab() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [townFilter, setTownFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (levelFilter) params.set("level", levelFilter);
      if (townFilter) params.set("town", townFilter);
      const res = await fetch(`/api/master-data/schools?${params}`);
      const data = await res.json();
      setSchools(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("加载学校列表失败");
    } finally {
      setLoading(false);
    }
  }, [search, levelFilter, townFilter]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // 从已有数据动态提取镇街列表
  const towns = Array.from(new Set(schools.map((s) => s.town).filter(Boolean))) as string[];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSchools();
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      const url = editing
        ? `/api/master-data/schools/${editing.id}`
        : "/api/master-data/schools";
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
      fetchSchools();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    }
  };

  const handleDelete = async (school: School) => {
    if (!confirm(`确定要删除学校「${school.name}」吗？`)) return;
    try {
      const res = await fetch(`/api/master-data/schools/${school.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      toast.success("已删除");
      fetchSchools();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await fetch("/api/master-data/schools/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "导入失败");
      toast.success(`导入完成：新增 ${data.inserted} 条，跳过 ${data.skipped} 条`);
      fetchSchools();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "导入失败");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (s: School) => { setEditing(s); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">共 {schools.length} 所学校</p>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm">
            <Upload className="w-4 h-4" /> CSV 导入
          </button>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 text-sm">
            <Plus className="w-4 h-4" /> 新增学校
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索学校名称..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none" />
        </div>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">全部学段</option>
          {SCHOOL_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <select value={townFilter} onChange={(e) => setTownFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">全部镇街</option>
          {towns.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">搜索</button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : schools.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无学校数据</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-3 py-2 font-medium">校名</th>
                <th className="px-3 py-2 font-medium">地区</th>
                <th className="px-3 py-2 font-medium">镇街</th>
                <th className="px-3 py-2 font-medium">学段</th>
                <th className="px-3 py-2 font-medium">重点</th>
                <th className="px-3 py-2 font-medium">等级</th>
                <th className="px-3 py-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <SchoolRow key={s.id} school={s} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <SchoolFormModal
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
