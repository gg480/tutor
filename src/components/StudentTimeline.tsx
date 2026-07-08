"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { Clock, TrendingUp, BookOpen, Award } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  details: string;
  icon: string;
}

interface TimelineData {
  student: any;
  events: TimelineEvent[];
  stats: {
    totalEvents: number;
    totalCourses: number;
    totalRecords: number;
    totalMistakes: number;
    totalScores: number;
    totalAchievements: number;
    averageMastery: number;
    daysSinceCreated: number;
  };
}

interface Props {
  studentId: string;
}

const TYPE_COLORS: Record<string, string> = {
  milestone: "bg-purple-100 border-purple-300",
  assessment: "bg-blue-100 border-blue-300",
  plan: "bg-confidence-100 border-confidence-300",
  course: "bg-green-100 border-green-300",
  record: "bg-shibu-100 border-shibu-300",
  mistake: "bg-orange-100 border-orange-300",
  score: "bg-cyan-100 border-cyan-300",
  achievement: "bg-amber-100 border-amber-300",
  report: "bg-pink-100 border-pink-300",
};

export default function StudentTimeline({ studentId }: Props) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch(`/api/students/${studentId}/timeline`);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        console.error("加载时间线失败", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [studentId]);

  if (loading) {
    return <div className="text-center py-10 text-gray-400">加载中...</div>;
  }

  if (!data || data.events.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无成长记录</p>
      </div>
    );
  }

  const { events, stats } = data;

  // 按月份分组
  const grouped = events.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    const month = ev.date.slice(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(ev);
    return acc;
  }, {});

  return (
    <div>
      {/* 统计概览 */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: "学习天数", value: stats.daysSinceCreated, icon: Clock, color: "text-shibu-600" },
          { label: "完成课程", value: stats.totalCourses, icon: BookOpen, color: "text-green-600" },
          { label: "学情记录", value: stats.totalRecords, icon: BookOpen, color: "text-blue-600" },
          { label: "错题处理", value: stats.totalMistakes, icon: BookOpen, color: "text-orange-600" },
          { label: "平均掌握度", value: stats.averageMastery.toFixed(1), icon: TrendingUp, color: "text-purple-600" },
        ].map((s, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 时间线 */}
      <div className="relative">
        {/* 中轴线 */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200" />

        {Object.entries(grouped).map(([month, monthEvents]) => (
          <div key={month} className="mb-6">
            {/* 月份标签 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-6 rounded-full bg-shibu-100 text-shibu-600 text-[11px] font-semibold flex items-center justify-center z-10">
                {month.slice(5)}月
              </div>
              <span className="text-xs text-gray-400">{month}</span>
            </div>

            {/* 事件列表 */}
            <div className="space-y-3 ml-5">
              {monthEvents.map((event) => (
                <div
                  key={event.id}
                  className="relative pl-8 pb-1"
                >
                  {/* 事件图标 */}
                  <div
                    className={`absolute left-[-14px] top-0 w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 ${
                      TYPE_COLORS[event.type] || "bg-gray-100 border-gray-300"
                    }`}
                  >
                    {event.icon}
                  </div>

                  {/* 事件内容 */}
                  <div className="bg-white rounded-lg p-3 border border-gray-100 hover:shadow-sm transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-300 shrink-0 ml-2">
                        {new Date(event.date).toLocaleDateString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </span>
                    </div>
                    {event.details && (
                      <p className="text-[11px] text-gray-400 mt-1.5 bg-gray-50 rounded px-2 py-1">
                        {event.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
