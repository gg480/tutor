"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  AlertTriangle,
  BookOpen,
  Trophy,
  Clock,
  ChevronRight,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

interface NotificationData {
  todayCourses: {
    total: number;
    done: number;
    pending: number;
    items: {
      id: string;
      studentName: string;
      grade: string;
      subject: string;
      startTime: string;
      endTime: string;
      status: string;
    }[];
  };
  renewAlerts: {
    total: number;
    items: {
      studentName: string;
      grade: string;
      packageName: string;
      remainingHours: number;
      usedPercent: number;
    }[];
  };
  pendingRecords: {
    total: number;
    items: {
      studentName: string;
      grade: string;
      subject: string;
      completedAt: string;
    }[];
  };
  recentAchievements: {
    id: string;
    title: string;
    level: string;
    studentName: string;
    awardDate: string;
  }[];
}

const LEVEL_ICONS: Record<string, string> = {
  school: "📋", city: "🏆", provincial: "🥇", national: "🏅", international: "👑",
};

export default function NotificationsPage() {
  const { status } = useSession();
  const [data, setData] = useState<NotificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-gray-400">加载失败</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-shibu-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
          <p className="text-sm text-gray-500 mt-1">
            今日待办 · 续费预警 · 待记录学情
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 今日课程 */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-shibu-500" />
              <h2 className="text-sm font-semibold text-gray-700">今日课程</h2>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              data.todayCourses.pending > 0 ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
            }`}>
              {data.todayCourses.pending}节待上课
            </span>
          </div>
          <div className="p-5">
            {data.todayCourses.items.length > 0 ? (
              <div className="space-y-3">
                {data.todayCourses.items.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        c.status === "completed" ? "bg-green-400" : "bg-blue-400"
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {c.studentName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {c.subject} · {c.grade}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(c.startTime).toLocaleTimeString("zh-CN", {
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                      <span className={`text-[10px] ${
                        c.status === "completed" ? "text-green-500" : "text-blue-500"
                      }`}>
                        {c.status === "completed" ? "已完成" : "待上课"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-sm">今日无课程安排</p>
              </div>
            )}
          </div>
        </div>

        {/* 续费预警 */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-sm font-semibold text-gray-700">续费预警</h2>
            </div>
            {data.renewAlerts.total > 0 && (
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                {data.renewAlerts.total}个
              </span>
            )}
          </div>
          <div className="p-5">
            {data.renewAlerts.items.length > 0 ? (
              <div className="space-y-3">
                {data.renewAlerts.items.map((r, i) => (
                  <div key={i} className="bg-orange-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {r.studentName}
                      </span>
                      <span className="text-xs text-orange-600 font-medium">
                        剩{r.remainingHours}课时
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{r.packageName}</p>
                    <div className="bg-orange-200 rounded-full h-1.5">
                      <div className="bg-orange-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(r.usedPercent, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-sm">暂无续费预警</p>
                <p className="text-xs mt-1">所有课程包剩余课时充足</p>
              </div>
            )}
          </div>
        </div>

        {/* 待记录学情 */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <h2 className="text-sm font-semibold text-gray-700">待记录学情</h2>
            </div>
            {data.pendingRecords.total > 0 && (
              <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                {data.pendingRecords.total}条
              </span>
            )}
          </div>
          <div className="p-5">
            {data.pendingRecords.items.length > 0 ? (
              <div className="space-y-3">
                {data.pendingRecords.items.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {r.studentName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {r.subject} · {new Date(r.completedAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <a
                      href={`/dashboard/records?recordFor=${r.studentName}`}
                      className="text-xs px-3 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                    >
                      去记录
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-sm">无待记录学情</p>
                <p className="text-xs mt-1">所有课程已跟进学情</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 近期竞赛成果 */}
      {data.recentAchievements.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100">
          <div className="p-5 border-b border-gray-50 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-confidence-500" />
            <h2 className="text-sm font-semibold text-gray-700">近期竞赛成果</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.recentAchievements.map((a) => (
                <div key={a.id} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
                  <div className="text-2xl mb-2">
                    {LEVEL_ICONS[a.level] || "🏆"}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {a.studentName} · {formatDate(a.awardDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
