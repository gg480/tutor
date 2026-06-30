"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Users, Phone, Calendar, TrendingUp, UserPlus } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Trial {
  id: string;
  studentName: string;
  grade: string;
  parentName: string | null;
  parentPhone: string | null;
  subject: string | null;
  source: string;
  status: string;
  trialDate: string | null;
  notes: string | null;
  convertedStudent: { id: string; name: string } | null;
  createdAt: string;
}

interface Summary {
  total: number;
  contacted: number;
  scheduled: number;
  done: number;
  converted: number;
  lost: number;
  conversionRate: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  contacted: { label: "已联系", color: "bg-blue-100 text-blue-700", icon: "📞" },
  trial_scheduled: { label: "已预约试听", color: "bg-purple-100 text-purple-700", icon: "📅" },
  trial_done: { label: "已试听", color: "bg-orange-100 text-orange-700", icon: "🎧" },
  converted: { label: "已转化", color: "bg-green-100 text-green-700", icon: "✅" },
  lost: { label: "已流失", color: "bg-gray-100 text-gray-500", icon: "❌" },
};

const SOURCE_LABELS: Record<string, string> = {
  wechat: "微信", referral: "推荐", social: "社交媒体", other: "其他",
};

export default function TrialsPage() {
  const { status } = useSession();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    studentName: "",
    grade: "",
    parentName: "",
    parentPhone: "",
    subject: "",
    source: "wechat",
    notes: "",
  });
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchTrials();
  }, [status, filterStatus]);

  const fetchTrials = async () => {
    try {
      const res = await fetch("/api/trials");
      const data = await res.json();
      setTrials(data.data || []);
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName || !form.grade) {
      toast.error("请填写姓名和年级");
      return;
    }
    try {
      const res = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("创建失败");
      toast.success("试听记录已创建");
      setShowForm(false);
      setForm({ studentName: "", grade: "", parentName: "", parentPhone: "", subject: "", source: "wechat", notes: "" });
      fetchTrials();
    } catch (err) {
      toast.error("创建失败");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/trials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("状态已更新");
      fetchTrials();
    } catch (err) {
      toast.error("更新失败");
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  const filtered = filterStatus ? trials.filter((t) => t.status === filterStatus) : trials;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">试听管理</h1>
          <p className="text-sm text-gray-500 mt-1">追踪从咨询到付费的转化</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 新建线索
        </button>
      </div>

      {/* 转化漏斗 */}
      {summary && (
        <div className="grid grid-cols-6 gap-3 mb-6">
          {[
            { label: "总线索", value: summary.total, color: "bg-gray-50 text-gray-700" },
            { label: "已联系", value: summary.contacted, color: "bg-blue-50 text-blue-700" },
            { label: "已预约", value: summary.scheduled, color: "bg-purple-50 text-purple-700" },
            { label: "已试听", value: summary.done, color: "bg-orange-50 text-orange-700" },
            { label: "已转化", value: summary.converted, color: "bg-green-50 text-green-700" },
            { label: "转化率", value: `${summary.conversionRate}%`, color: "bg-shibu-50 text-shibu-700" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-3 text-center ${item.color}`}>
              <p className="text-xl font-bold">{item.value}</p>
              <p className="text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* 状态筛选 */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {["", "contacted", "trial_scheduled", "trial_done", "converted", "lost"].map((s) => {
          const cfg = STATUS_CONFIG[s] || { label: "全部", color: "bg-gray-100 text-gray-600" };
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                filterStatus === s ? `${cfg.color} border-transparent` : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>还没有试听记录</p>
          <p className="text-sm mt-1">点击「新建线索」开始追踪</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.contacted;
            return (
              <div key={t.id} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{t.studentName}</span>
                      <span className="text-xs text-gray-400">{t.grade}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {t.parentName && <span>{t.parentName}</span>}
                      {t.parentPhone && <span>{t.parentPhone}</span>}
                      {t.subject && <span>{t.subject}</span>}
                      <span>{SOURCE_LABELS[t.source] || t.source}</span>
                      {t.trialDate && <span>试听：{formatDate(t.trialDate)}</span>}
                    </div>
                    {t.notes && <p className="text-sm text-gray-600 mt-2">{t.notes}</p>}
                    {t.convertedStudent && (
                      <p className="text-xs text-green-600 mt-1">✅ 已转化为正式学员：{t.convertedStudent.name}</p>
                    )}
                  </div>

                  {/* 状态推进 */}
                  <div className="flex gap-1 ml-4">
                    {t.status === "contacted" && (
                      <button onClick={() => handleStatusChange(t.id, "trial_scheduled")}
                        className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">预约试听</button>
                    )}
                    {t.status === "trial_scheduled" && (
                      <button onClick={() => handleStatusChange(t.id, "trial_done")}
                        className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded hover:bg-orange-100">完成试听</button>
                    )}
                    {t.status === "trial_done" && (
                      <button onClick={() => handleStatusChange(t.id, "converted")}
                        className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">标记转化</button>
                    )}
                    {!["converted", "lost"].includes(t.status) && (
                      <button onClick={() => handleStatusChange(t.id, "lost")}
                        className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded hover:bg-gray-100">流失</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 新建表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">新建线索</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学生姓名</label>
                  <input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                  <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required>
                    <option value="">选择</option>
                    {["小四","小五","小六","初一","初二","初三","高一","高二","高三"].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">家长姓名</label>
                  <input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                  <input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">意向科目</label>
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：数学" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">来源</label>
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="wechat">微信</option>
                    <option value="referral">推荐</option>
                    <option value="social">社交媒体</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
                <button type="submit" className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm">创建线索</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
