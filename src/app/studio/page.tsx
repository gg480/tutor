"use client";

import { useEffect, useState } from "react";
import { Award, Users, GraduationCap, Target, ChevronRight } from "lucide-react";

interface StudioData {
  stats: {
    totalStudents: number;
    totalAchievements: number;
    achievementsByLevel: Record<string, number>;
    subjects: string[];
  };
  achievements: {
    id: string;
    title: string;
    level: string;
    studentName: string;
    awardDate: string;
    organization: string | null;
  }[];
  studio: {
    name: string;
    slogan: string;
    description: string;
    since: string;
    features: { icon: string; title: string; desc: string }[];
  };
}

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  school: { label: "校级", color: "bg-gray-100 text-gray-700 border-gray-300" },
  city: { label: "市级", color: "bg-blue-50 text-blue-700 border-blue-300" },
  provincial: { label: "省级", color: "bg-green-50 text-green-700 border-green-300" },
  national: { label: "国家级", color: "bg-orange-50 text-orange-700 border-orange-300" },
  international: { label: "国际级", color: "bg-red-50 text-red-700 border-red-300" },
};

export default function StudioPage() {
  const [data, setData] = useState<StudioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/studio")
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" />
      </div>
    );
  }

  if (!data) return null;

  const { studio, stats, achievements } = data;

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-shibu-600">拾步</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">工作室</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#features" className="text-gray-600 hover:text-shibu-600">教学特色</a>
            <a href="#achievements" className="text-gray-600 hover:text-shibu-600">成果展示</a>
            <a href="#contact" className="text-gray-600 hover:text-shibu-600">联系我们</a>
          </div>
        </div>
      </nav>

      {/* 英雄区 */}
      <section className="bg-gradient-to-br from-shibu-800 via-shibu-900 to-shibu-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold mb-4">{studio.name}</h1>
          <p className="text-xl text-shibu-200 mb-8">{studio.slogan}</p>
          <p className="text-base text-shibu-300 max-w-2xl mx-auto leading-relaxed">
            {studio.description}
          </p>
          <div className="flex justify-center gap-8 mt-10">
            {[
              { icon: Users, value: stats.totalStudents, label: "在读学员" },
              { icon: Award, value: stats.totalAchievements, label: "竞赛获奖" },
              { icon: GraduationCap, value: stats.subjects.length, label: "辅导科目" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <item.icon className="w-6 h-6 mx-auto mb-2 text-shibu-300" />
                <p className="text-3xl font-bold">{item.value}</p>
                <p className="text-sm text-shibu-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 教学特色 */}
      <section id="features" className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            教学特色
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {studio.features.map((f) => (
              <div key={f.title} className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-shibu-50 transition border border-gray-100">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 竞赛成果墙 */}
      <section id="achievements" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
            竞赛成果
          </h2>
          <p className="text-sm text-gray-500 text-center mb-10">
            学员获得的各级奖项
          </p>

          {/* 级别统计 */}
          <div className="grid grid-cols-5 gap-4 mb-10">
            {[
              { key: "school", label: "校级" },
              { key: "city", label: "市级" },
              { key: "provincial", label: "省级" },
              { key: "national", label: "国家级" },
              { key: "international", label: "国际级" },
            ].map(({ key, label }) => (
              <div key={key} className="bg-white rounded-xl p-4 text-center border border-gray-100">
                <p className="text-2xl font-bold text-shibu-600">
                  {stats.achievementsByLevel[key] || 0}
                </p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* 奖项列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((a) => {
              const levelConf = LEVEL_CONFIG[a.level] || LEVEL_CONFIG.school;
              return (
                <div key={a.id} className="bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4 hover:shadow-md transition">
                  <div className="text-3xl">
                    {a.level === "international" ? "👑" : a.level === "national" ? "🏅" : a.level === "provincial" ? "🥇" : a.level === "city" ? "🏆" : "📋"}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {a.studentName}
                      {a.organization && ` · ${a.organization}`}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${levelConf.color}`}>
                        {levelConf.label}
                      </span>
                      <span className="text-xs text-gray-400">{a.awardDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {achievements.length === 0 && (
            <p className="text-center text-gray-400 py-10">暂无竞赛成果记录</p>
          )}
        </div>
      </section>

      {/* 联系我们 */}
      <section id="contact" className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">联系我们</h2>
          <p className="text-sm text-gray-500 mb-8">
            让每一个孩子的进步都被看见
          </p>
          <div className="bg-gradient-to-r from-shibu-50 to-blue-50 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-gray-400 mb-1">📍 地址</p>
                <p className="text-gray-700">本地 · 社区工作室</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">📱 微信</p>
                <p className="text-gray-700">扫描下方二维码咨询</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">⏰ 营业时间</p>
                <p className="text-gray-700">周六日 8:00-18:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <p>拾步工作室 © {new Date().getFullYear()}</p>
          <p className="text-xs mt-1">本地家教工作室 · 专注应试提分与竞赛培优</p>
        </div>
      </footer>
    </div>
  );
}
