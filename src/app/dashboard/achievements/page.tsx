"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import { Trophy, Plus, Medal, Award } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Achievement {
  id: string;
  studentId: string;
  title: string;
  level: string;
  awardDate: string;
  organization: string | null;
  certificateUrl: string | null;
  description: string | null;
  createdAt: string;
  student: { id: string; name: string; grade: { name: string } | null };
}

interface Student {
  id: string;
  name: string;
  gradeName: string;
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  school: { label: "校级", color: "bg-gray-100 text-gray-600", icon: "📋" },
  city: { label: "市级", color: "bg-blue-100 text-blue-600", icon: "🏆" },
  provincial: { label: "省级", color: "bg-green-100 text-green-600", icon: "🥇" },
  national: { label: "国家级", color: "bg-orange-100 text-orange-600", icon: "🏅" },
  international: { label: "国际级", color: "bg-red-100 text-red-600", icon: "👑" },
};

export default function AchievementsPage() {
  const { status } = useSession();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [form, setForm] = useState({
    studentId: "",
    title: "",
    level: "city",
    awardDate: new Date().toISOString().split("T")[0],
    organization: "",
    description: "",
  });

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch("/api/achievements");
      const data = await res.json();
      setAchievements(data.data || []);
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      setStudents(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") {
      fetchAchievements();
      fetchStudents();
    }
  }, [status, fetchAchievements, fetchStudents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.title || !form.awardDate) {
      toast.error("请填写完整信息");
      return;
    }

    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("创建失败");

      toast.success("竞赛成果已记录！");
      setShowForm(false);
      setForm({
        studentId: "",
        title: "",
        level: "city",
        awardDate: new Date().toISOString().split("T")[0],
        organization: "",
        description: "",
      });
      fetchAchievements();
    } catch (err) {
      toast.error("创建失败");
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">竞赛成果</h1>
          <p className="text-sm text-gray-500 mt-1">
            记录学生的竞赛获奖和荣誉成就
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 记录获奖
        </button>
      </div>

      {/* 统计概览 */}
      {summary && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { key: "school", label: "校级" },
            { key: "city", label: "市级" },
            { key: "provincial", label: "省级" },
            { key: "national", label: "国家级" },
            { key: "international", label: "国际级" },
          ].map(({ key, label }) => (
            <div key={key} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-shibu-600">
                {summary.byLevel[key] || 0}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : achievements.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>还没有竞赛成果记录</p>
          <p className="text-sm mt-1">点击「记录获奖」开始记录学生的荣誉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((a) => {
            const levelConfig = LEVEL_CONFIG[a.level] || LEVEL_CONFIG.school;
            return (
              <div
                key={a.id}
                className="bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4"
              >
                <div className="text-3xl">{levelConfig.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${levelConfig.color}`}>
                      {levelConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {a.student.name}
                    </span>
                    <span>{a.student.grade?.name}</span>
                    {a.organization && <span>颁发：{a.organization}</span>}
                    <span>{formatDate(a.awardDate)}</span>
                  </div>
                  {a.description && (
                    <p className="text-sm text-gray-600 mt-2">{a.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 新建弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">记录竞赛获奖</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学生</label>
                <select
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required
                >
                  <option value="">选择学生</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}（{s.gradeName}）
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">奖项名称</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder='如："2026年市奥数竞赛三等奖"'
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">奖项级别</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="school">校级</option>
                    <option value="city">市级</option>
                    <option value="provincial">省级</option>
                    <option value="national">国家级</option>
                    <option value="international">国际级</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">获奖日期</label>
                  <input
                    type="date"
                    value={form.awardDate}
                    onChange={(e) => setForm({ ...form, awardDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">颁发机构</label>
                <input
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="如：市教育局、数学学会"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  rows={2}
                  placeholder="补充说明..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                  取消
                </button>
                <button type="submit" className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm">
                  保存获奖记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
