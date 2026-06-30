"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Trash2, BookOpen, Layers } from "lucide-react";

interface KnowledgePoint {
  id: string;
  subject: string;
  grade: string;
  name: string;
  level: number;
  sortOrder: number;
  _count: { mistakes: number };
}

export default function KnowledgePointsPage() {
  const { status } = useSession();
  const [points, setPoints] = useState<KnowledgePoint[]>([]);
  const [bySubject, setBySubject] = useState<Record<string, KnowledgePoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "数学", grade: "初一", name: "" });

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchPoints();
  }, [status]);

  const fetchPoints = async () => {
    try {
      const res = await fetch("/api/knowledge-points");
      const data = await res.json();
      setPoints(data.data || []);
      setBySubject(data.bySubject || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("请填写知识点名称"); return; }
    try {
      const res = await fetch("/api/knowledge-points", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("创建失败");
      toast.success("知识点已创建");
      setShowForm(false);
      setForm({ subject: "数学", grade: "初一", name: "" });
      fetchPoints();
    } catch (err) { toast.error("创建失败"); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除知识点「${name}」吗？`)) return;
    try {
      const res = await fetch(`/api/knowledge-points/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      toast.success("已删除");
      fetchPoints();
    } catch (err) { toast.error("删除失败"); }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  const subjects = Object.keys(bySubject);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知识点管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理学科知识点图谱 · 共 {points.length} 个节点</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> 新增知识点
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>暂无知识点</p>
        </div>
      ) : (
        <div className="space-y-6">
          {subjects.map((subject) => (
            <div key={subject} className="bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-shibu-500" />
                <h2 className="text-sm font-semibold text-gray-700">{subject}</h2>
                <span className="text-xs text-gray-400">({bySubject[subject].length} 个知识点)</span>
              </div>
              <div className="p-3">
                {(() => {
                  // 按年级分组
                  const byGrade: Record<string, KnowledgePoint[]> = {};
                  bySubject[subject].forEach((p) => {
                    if (!byGrade[p.grade]) byGrade[p.grade] = [];
                    byGrade[p.grade].push(p);
                  });
                  return Object.entries(byGrade).map(([grade, gradePoints]) => (
                    <div key={grade} className="mb-2 last:mb-0">
                      <p className="text-xs text-gray-400 px-2 py-1">{grade}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {gradePoints.map((p) => (
                          <div key={p.id} className="group flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-700 hover:bg-shibu-50 transition">
                            <span>{p.name}</span>
                            {p._count.mistakes > 0 && (
                              <span className="text-[10px] text-orange-500">({p._count.mistakes})</span>
                            )}
                            <button onClick={() => handleDelete(p.id, p.name)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition ml-0.5">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">新增知识点</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学科</label>
                  <select value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="数学">数学</option><option value="物理">物理</option>
                    <option value="英语">英语</option><option value="语文">语文</option>
                    <option value="化学">化学</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                  <select value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {["小四","小五","小六","初一","初二","初三","高一","高二","高三"].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">知识点名称</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：一元一次方程" required />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
                <button type="submit" className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
