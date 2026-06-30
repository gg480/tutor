"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import { Save, Key, Info, Shield, Server, Lock } from "lucide-react";

interface SettingsData {
  user: { id: string; name: string; email: string; role: string; createdAt: string };
  system: { totalStudents: number; totalCourses: number; totalUsers: number; nodeEnv: string; nextAuthUrl: string };
  studio: { name: string; slogan: string; since: string };
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("请填写所有密码字段");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("两次新密码不一致");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("新密码至少6位");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("密码修改成功！");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  if (!data) return <div className="text-center py-20 text-gray-400">加载失败</div>;

  const { user, system, studio } = data;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <p className="text-sm text-gray-500 mt-1">账号安全 · 系统信息</p>
      </div>

      {/* 账号信息 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-shibu-500" />
          <h2 className="text-base font-semibold text-gray-900">账号信息</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">用户名</p>
            <p className="text-gray-800 font-medium mt-0.5">{user.name || "未设置"}</p>
          </div>
          <div>
            <p className="text-gray-400">邮箱</p>
            <p className="text-gray-800 font-medium mt-0.5">{user.email}</p>
          </div>
          <div>
            <p className="text-gray-400">角色</p>
            <p className="text-gray-800 font-medium mt-0.5">{user.role === "admin" ? "管理员" : "教师"}</p>
          </div>
          <div>
            <p className="text-gray-400">注册时间</p>
            <p className="text-gray-800 font-medium mt-0.5">
              {new Date(user.createdAt).toLocaleDateString("zh-CN")}
            </p>
          </div>
        </div>
      </div>

      {/* 修改密码 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-shibu-500" />
          <h2 className="text-base font-semibold text-gray-900">修改密码</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
            <input type="password" value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input type="password" value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
            <input type="password" value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "修改中..." : "修改密码"}
          </button>
        </form>
      </div>

      {/* 系统信息 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Server className="w-5 h-5 text-shibu-500" />
          <h2 className="text-base font-semibold text-gray-900">系统信息</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: "学生总数", value: system.totalStudents },
            { label: "课程总数", value: system.totalCourses },
            { label: "用户数", value: system.totalUsers },
            { label: "运行环境", value: system.nodeEnv },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-shibu-600">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-400">
          <p>NextAuth URL: {system.nextAuthUrl}</p>
          <p className="mt-1">拾步 OPC Tutor Suite v0.1.0</p>
        </div>
      </div>
    </div>
  );
}
