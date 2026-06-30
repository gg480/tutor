"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Info, Code, Database, FileText, Github } from "lucide-react";

export default function AboutPage() {
  const { status } = useSession();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchHealth();
  }, [status]);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">关于 OPC Tutor Suite</h1>
        <p className="text-sm text-gray-500">个人家教工作室全周期教学管理系统</p>
      </div>

      <div className="space-y-4">
        {/* 版本信息 */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-shibu-500" />
            <h2 className="text-sm font-semibold text-gray-700">版本信息</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">版本</span><span className="text-gray-700">v0.1.0</span></div>
            <div className="flex justify-between"><span className="text-gray-400">迭代轮次</span><span className="text-gray-700">49 / 120</span></div>
            <div className="flex justify-between"><span className="text-gray-400">技术栈</span><span className="text-gray-700">Next.js 14 + Prisma + SQLite</span></div>
            <div className="flex justify-between"><span className="text-gray-400">框架</span><span className="text-gray-700">Next.js App Router</span></div>
            <div className="flex justify-between"><span className="text-gray-400">数据库</span><span className="text-gray-700">SQLite (可切换PostgreSQL)</span></div>
          </div>
        </div>

        {/* 系统统计 */}
        {stats && (
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-shibu-500" />
              <h2 className="text-sm font-semibold text-gray-700">系统状态</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">系统状态</span>
                <span className={`font-medium ${stats.status === "healthy" ? "text-green-600" : "text-orange-600"}`}>
                  {stats.status === "healthy" ? "✅ 健康" : "⚠️ 降级"}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-gray-400">数据库</span>
                <span className={stats.checks?.database?.status === "ok" ? "text-green-600" : "text-red-600"}>
                  {stats.checks?.database?.status === "ok" ? "✅ 连接正常" : "❌ 连接失败"}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-gray-400">数据概览</span>
                <span className="text-gray-700">{stats.checks?.data?.detail || "-"}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-400">数据表</span>
                <span className="text-gray-700">{stats.checks?.tables?.detail || "-"}</span>
              </div>
            </div>
          </div>
        )}

        {/* 功能统计 */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-5 h-5 text-shibu-500" />
            <h2 className="text-sm font-semibold text-gray-700">功能统计</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "API路由", value: "43" },
              { label: "UI页面", value: "34" },
              { label: "数据模型", value: "16" },
              { label: "E2E测试", value: "49" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-shibu-600">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 链接 */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-shibu-500" />
            <h2 className="text-sm font-semibold text-gray-700">链接</h2>
          </div>
          <div className="space-y-2 text-sm">
            <a href="/README.md" className="flex items-center gap-2 text-shibu-600 hover:text-shibu-700" target="_blank">
              <FileText className="w-4 h-4" /> 项目文档
            </a>
            <a href="/api/health" className="flex items-center gap-2 text-shibu-600 hover:text-shibu-700" target="_blank">
              <Database className="w-4 h-4" /> 健康检查 API
            </a>
            <a href="/studio" className="flex items-center gap-2 text-shibu-600 hover:text-shibu-700" target="_blank">
              <Info className="w-4 h-4" /> 工作室品牌页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
