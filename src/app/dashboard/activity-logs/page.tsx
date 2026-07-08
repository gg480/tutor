"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { History, Clock, Filter } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Log {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  details: string | null;
  userId: string | null;
  createdAt: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  create: { label: "创建", color: "bg-green-100 text-green-700" },
  update: { label: "更新", color: "bg-blue-100 text-blue-700" },
  delete: { label: "删除", color: "bg-red-100 text-red-700" },
};

const ENTITY_LABELS: Record<string, string> = {
  student: "学生", course: "课程", record: "学情",
  mistake: "错题", score: "成绩", registration: "课程包", trial: "试听",
};

export default function ActivityLogsPage() {
  const { status } = useSession();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterEntity) params.set("entity", filterEntity);
        if (filterAction) params.set("action", filterAction);
        const res = await fetch(`/api/activity-logs?${params}`);
        const data = await res.json();
        setLogs(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchLogs();
  }, [status, filterEntity, filterAction]);

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <History className="w-6 h-6 text-shibu-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">操作日志</h1>
          <p className="text-sm text-gray-500 mt-1">系统所有关键操作的审计记录</p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-3 mb-6">
        <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">全部类型</option>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">全部操作</option>
          <option value="create">创建</option>
          <option value="update">更新</option>
          <option value="delete">删除</option>
        </select>
        {logs.length > 0 && (
          <span className="text-sm text-gray-400 self-center ml-auto">
            共 {logs.length} 条记录
          </span>
        )}
      </div>

      {/* 日志列表 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>暂无操作日志</p>
          <p className="text-sm mt-1">进行创建/更新/删除操作后，日志将自动记录</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.create;
            return (
              <div key={log.id} className="bg-white rounded-lg px-4 py-3 border border-gray-100 flex items-center gap-4 text-sm">
                <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                <span className={`text-xs px-2 py-0.5 rounded-full ${actionCfg.color} shrink-0`}>
                  {actionCfg.label}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                  {ENTITY_LABELS[log.entity] || log.entity}
                </span>
                <span className="text-gray-700 flex-1">{log.summary}</span>
                <span className="text-xs text-gray-400 shrink-0">{formatDateTime(log.createdAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
