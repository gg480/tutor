"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import { CalendarDays, Plus, MapPin, Users, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface StudyEvent {
  id: string;
  title: string;
  type: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  maxParticipants: number | null;
  fee: number | null;
  status: string;
  _count: { participants: number };
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  self_study: { label: "自习", color: "bg-blue-50 text-blue-700" },
  competition_weekend: { label: "竞赛周末", color: "bg-purple-50 text-purple-700" },
  seminar: { label: "专题研习", color: "bg-green-50 text-green-700" },
  other: { label: "其他", color: "bg-gray-50 text-gray-700" },
};

export default function EventsPage() {
  const { status } = useSession();
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", type: "self_study", description: "", startTime: "", endTime: "",
    location: "", maxParticipants: "10", fee: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchEvents();
  }, [status]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startTime || !form.endTime) {
      toast.error("请填写完整信息"); return;
    }
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("创建失败");
      toast.success("活动已创建");
      setShowForm(false);
      setForm({ title: "", type: "self_study", description: "", startTime: "", endTime: "", location: "", maxParticipants: "10", fee: "" });
      fetchEvents();
    } catch (err) { toast.error("创建失败"); }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学习活动</h1>
          <p className="text-sm text-gray-500 mt-1">自习 · 竞赛周末 · 专题研习会</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> 创建活动
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>还没有学习活动</p>
          <p className="text-sm mt-1">创建自习、竞赛周末或专题研习会</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => {
            const typeCfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other;
            return (
              <div key={event.id} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeCfg.color}`}>
                      {typeCfg.label}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    event.status === "scheduled" ? "bg-blue-50 text-blue-600" :
                    event.status === "ongoing" ? "bg-green-50 text-green-600" :
                    event.status === "completed" ? "bg-gray-50 text-gray-500" : "bg-red-50 text-red-600"
                  }`}>
                    {event.status === "scheduled" ? "即将开始" : event.status === "ongoing" ? "进行中" : event.status === "completed" ? "已结束" : "已取消"}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                )}

                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDateTime(event.startTime)} ~ {formatDateTime(event.endTime)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>{event._count.participants}/{event.maxParticipants || "∞"} 人</span>
                    {event.fee !== null && event.fee > 0 && (
                      <span className="ml-2">费用：¥{event.fee}</span>
                    )}
                    {event.fee === 0 && <span className="ml-2 text-green-500">免费</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">创建活动</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动名称</label>
                <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="self_study">自习</option>
                  <option value="competition_weekend">竞赛周末</option>
                  <option value="seminar">专题研习</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({...form, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
                  <input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">人数上限</label>
                  <input type="number" value={form.maxParticipants} onChange={(e) => setForm({...form, maxParticipants: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">费用</label>
                  <input type="number" value={form.fee} onChange={(e) => setForm({...form, fee: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="0=免费" />
                </div>
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
