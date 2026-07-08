"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Plus, Trash2, Pencil, Upload, ChevronRight, ChevronDown, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { TextbookChapter, TextbookVersion, Grade, Subject } from "../types";

// 将树形结构扁平化为列表（用于父章节下拉选择）
function flattenChapters(nodes: TextbookChapter[], depth = 0, acc: { node: TextbookChapter; depth: number }[] = []) {
  nodes.forEach((n) => {
    acc.push({ node: n, depth });
    if (n.children.length > 0) flattenChapters(n.children, depth + 1, acc);
  });
  return acc;
}

// 章节表单弹窗
function ChapterFormModal({
  initial,
  flatChapters,
  onClose,
  onSubmit,
}: {
  initial: TextbookChapter | null;
  flatChapters: { node: TextbookChapter; depth: number }[];
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    chapterNo: initial?.chapterNo ?? "",
    chapterName: initial?.chapterName ?? "",
    parentChapterId: initial?.parentChapterId ?? "",
    order: initial?.order ?? 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        chapterNo: form.chapterNo,
        chapterName: form.chapterName,
        parentChapterId: form.parentChapterId || null,
        order: form.order,
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
          {initial ? "编辑章节" : "新增章节"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>章节编号 <span className="text-red-500">*</span></label>
              <input value={form.chapterNo} onChange={(e) => setForm({ ...form, chapterNo: e.target.value })}
                className={inputClass} placeholder="如：第1章" required />
            </div>
            <div>
              <label className={labelClass}>排序</label>
              <input type="number" value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>章节名称 <span className="text-red-500">*</span></label>
            <input value={form.chapterName} onChange={(e) => setForm({ ...form, chapterName: e.target.value })}
              className={inputClass} placeholder="如：有理数" required />
          </div>
          <div>
            <label className={labelClass}>父章节</label>
            <select value={form.parentChapterId} onChange={(e) => setForm({ ...form, parentChapterId: e.target.value })}
              className={inputClass}>
              <option value="">无（顶级章节）</option>
              {flatChapters
                .filter((item) => item.node.id !== initial?.id)
                .map((item) => (
                  <option key={item.node.id} value={item.node.id}>
                    {"　".repeat(item.depth)}{item.node.chapterNo} {item.node.chapterName}
                  </option>
                ))}
            </select>
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

// 递归渲染章节树节点
function ChapterTreeNode({
  node,
  depth,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
}: {
  node: TextbookChapter;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (n: TextbookChapter) => void;
  onDelete: (n: TextbookChapter) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 group" style={{ paddingLeft: `${12 + depth * 20}px` }}>
        <button onClick={() => hasChildren && onToggle(node.id)} className="text-gray-400 w-4">
          {hasChildren ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : null}
        </button>
        <BookOpen className="w-4 h-4 text-shibu-500" />
        <span className="text-sm text-gray-500 shrink-0">{node.chapterNo}</span>
        <span className="text-sm text-gray-900 flex-1">{node.chapterName}</span>
        <span className="text-xs text-gray-400">序{node.order}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
          <button onClick={() => onEdit(node)} className="p-1 text-gray-400 hover:text-shibu-600 rounded">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(node)} className="p-1 text-gray-400 hover:text-red-600 rounded">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && node.children.map((child) => (
        <ChapterTreeNode key={child.id} node={child} depth={depth + 1}
          expandedIds={expandedIds} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function ChaptersTab() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [region, setRegion] = useState("南海区");
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [textbooks, setTextbooks] = useState<TextbookVersion[]>([]);
  const [textbookVersionId, setTextbookVersionId] = useState("");
  const [chapters, setChapters] = useState<TextbookChapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TextbookChapter | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始加载年级和学科
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

  // 联动加载教材版本列表
  const fetchTextbooks = useCallback(async () => {
    if (!region || !gradeId || !subjectId) {
      setTextbooks([]);
      setTextbookVersionId("");
      return;
    }
    try {
      const params = new URLSearchParams({ region, gradeId, subjectId });
      const res = await fetch(`/api/master-data/textbooks?${params}`);
      const data = await res.json();
      setTextbooks(data.data || []);
      setTextbookVersionId("");
    } catch (err) {
      console.error(err);
      toast.error("加载教材版本失败");
    }
  }, [region, gradeId, subjectId]);

  useEffect(() => { fetchTextbooks(); }, [fetchTextbooks]);

  // 加载章节树
  const fetchChapters = useCallback(async () => {
    if (!textbookVersionId) {
      setChapters([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/master-data/chapters?textbookVersionId=${textbookVersionId}`);
      const data = await res.json();
      setChapters(data.data || []);
      // 默认展开所有有子节点的章节
      const expandIds = new Set<string>();
      const collectIds = (nodes: TextbookChapter[]) => {
        nodes.forEach((n) => {
          if (n.children.length > 0) expandIds.add(n.id);
          collectIds(n.children);
        });
      };
      collectIds(data.data || []);
      setExpandedIds(expandIds);
    } catch (err) {
      console.error(err);
      toast.error("加载章节失败");
    } finally {
      setLoading(false);
    }
  }, [textbookVersionId]);

  useEffect(() => { fetchChapters(); }, [fetchChapters]);

  const flatChapters = useMemo(() => flattenChapters(chapters), [chapters]);

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      const url = editing ? `/api/master-data/chapters/${editing.id}` : "/api/master-data/chapters";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? data : { ...data, textbookVersionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "保存失败");
      }
      toast.success(editing ? "已更新" : "已创建");
      setShowForm(false);
      setEditing(null);
      fetchChapters();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    }
  };

  const handleDelete = async (chapter: TextbookChapter) => {
    if (!confirm(`确定要删除章节「${chapter.chapterNo} ${chapter.chapterName}」吗？`)) return;
    try {
      const res = await fetch(`/api/master-data/chapters/${chapter.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      toast.success("已删除");
      fetchChapters();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!textbookVersionId) {
      toast.error("请先选择教材版本");
      return;
    }
    try {
      const text = await file.text();
      const res = await fetch("/api/master-data/chapters/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "导入失败");
      toast.success(`导入完成：新增 ${data.inserted} 条，跳过 ${data.skipped} 条`);
      fetchChapters();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "导入失败");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openNew = () => {
    if (!textbookVersionId) {
      toast.error("请先选择教材版本");
      return;
    }
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (c: TextbookChapter) => { setEditing(c); setShowForm(true); };

  const inputClass = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none";
  const hasSelection = textbooks.length > 0;

  return (
    <div>
      {/* 教材版本选择器（联动） */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <p className="text-xs text-gray-500 mb-3">选择教材版本（地区+年级+学科 联动）</p>
        <div className="flex gap-2 flex-wrap mb-3">
          <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="地区"
            className={inputClass} />
          <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className={inputClass}>
            <option value="">选择年级</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputClass}>
            <option value="">选择学科</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {hasSelection && (
          <select value={textbookVersionId} onChange={(e) => setTextbookVersionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">选择教材版本</option>
            {textbooks.map((t) => (
              <option key={t.id} value={t.id}>{t.version}{t.publisher ? `（${t.publisher}）` : ""}</option>
            ))}
          </select>
        )}
      </div>

      {textbookVersionId && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">共 {flatChapters.length} 个章节节点</p>
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm">
                <Upload className="w-4 h-4" /> CSV 导入
              </button>
              <button onClick={openNew}
                className="flex items-center gap-2 px-4 py-2 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 text-sm">
                <Plus className="w-4 h-4" /> 新增章节
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无章节数据</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100">
              {chapters.map((node) => (
                <ChapterTreeNode key={node.id} node={node} depth={0}
                  expandedIds={expandedIds} onToggle={handleToggle}
                  onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <ChapterFormModal
          initial={editing}
          flatChapters={flatChapters}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
