"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  PiggyBank,
  BarChart3,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FinanceData {
  summary: {
    totalPrepayments: number;
    recognizedRevenue: number;
    deferredRevenue: number;
    avgPricePerHour: number;
    consumptionRate: number;
    totalUsedHours: number;
    totalRemainingHours: number;
    totalHours: number;
    activeRegistrations: number;
    totalStudents: number;
  };
  alerts: {
    lowHourCount: number;
    lowHourRegistrations: {
      id: string;
      studentName: string;
      grade: string;
      packageName: string;
      remainingHours: number;
      usedPercent: number;
    }[];
  };
  charts: {
    monthlyTrend: { month: string; courses: number; revenue: number }[];
  };
  registrations: {
    id: string;
    studentName: string;
    grade: string;
    packageName: string;
    totalHours: number;
    usedHours: number;
    remainingHours: number;
    price: number | null;
    consumedValue: number;
    remainingValue: number;
    usedPercent: number;
    status: string;
    createdAt: string;
  }[];
}

export default function FinancePage() {
  const { status } = useSession();
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/finance");
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

  if (!data) {
    return <div className="text-center py-20 text-gray-400">加载失败</div>;
  }

  const { summary, alerts, charts, registrations } = data;

  const overviewCards = [
    {
      label: "总预收款",
      value: `¥${summary.totalPrepayments.toLocaleString()}`,
      sub: `${summary.activeRegistrations} 个活跃课程包`,
      icon: DollarSign,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "已确认收入",
      value: `¥${summary.recognizedRevenue.toLocaleString()}`,
      sub: `耗课率 ${summary.consumptionRate}%`,
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "待确认收入（负债）",
      value: `¥${summary.deferredRevenue.toLocaleString()}`,
      sub: `${summary.totalRemainingHours} 课时待消耗`,
      icon: PiggyBank,
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "平均课时单价",
      value: `¥${summary.avgPricePerHour}`,
      sub: `总 ${summary.totalHours} 课时 · ${summary.totalStudents} 学生`,
      icon: BarChart3,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">业财看板</h1>
          <p className="text-sm text-gray-500 mt-1">
            预收款管理 · 收入确认 · 耗课追踪
          </p>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl p-5 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">{card.label}</span>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 月度收入趋势 */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            月度收入趋势
          </h2>
          {charts.monthlyTrend.length > 0 ? (
            <div className="flex items-end gap-2 h-40">
              {charts.monthlyTrend.map((m, i) => {
                const maxRevenue = Math.max(
                  ...charts.monthlyTrend.map((x) => x.revenue),
                  1
                );
                const h = (m.revenue / maxRevenue) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-[10px] text-green-600 font-medium">
                      ¥{m.revenue}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-shibu-500 to-shibu-400 rounded-t"
                      style={{ height: `${Math.max(h, 4)}%` }}
                    />
                    <span className="text-[9px] text-gray-400">
                      {m.month.slice(5)}月
                    </span>
                    <span className="text-[9px] text-gray-300">
                      {m.courses}节
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400">
              暂无月度数据
            </div>
          )}
        </div>

        {/* 续费预警 */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              续费预警
            </h2>
            {alerts.lowHourCount > 0 && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                {alerts.lowHourCount} 个
              </span>
            )}
          </div>
          {alerts.lowHourRegistrations.length > 0 ? (
            <div className="space-y-3">
              {alerts.lowHourRegistrations.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-orange-50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {alert.studentName}
                    </span>
                    <span className="text-xs text-orange-600 font-medium">
                      剩 {alert.remainingHours} 课时
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{alert.packageName}</p>
                  <div className="mt-2 bg-orange-200 rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(alert.usedPercent, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    已消耗 {alert.usedPercent}%
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-gray-400">
              暂无续费预警
            </div>
          )}
        </div>
      </div>

      {/* 课程包明细表 */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            课程包明细
          </h2>
        </div>
        {registrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-50">
                  <th className="text-left px-5 py-3 font-medium">学生</th>
                  <th className="text-left px-5 py-3 font-medium">课程包</th>
                  <th className="text-center px-5 py-3 font-medium">课时</th>
                  <th className="text-center px-5 py-3 font-medium">消耗</th>
                  <th className="text-right px-5 py-3 font-medium">金额</th>
                  <th className="text-right px-5 py-3 font-medium">已确认收入</th>
                  <th className="text-center px-5 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-5 py-3">
                      <span className="font-medium text-gray-900">
                        {r.studentName}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        {r.grade}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {r.packageName}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-700">
                      {r.usedHours}/{r.totalHours}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              r.usedPercent >= 80
                                ? "bg-red-400"
                                : r.usedPercent >= 50
                                ? "bg-yellow-400"
                                : "bg-green-400"
                            }`}
                            style={{ width: `${Math.min(r.usedPercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right">
                          {r.usedPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      ¥{r.price?.toLocaleString() || "-"}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      ¥{r.consumedValue.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          r.status === "active"
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {r.status === "active" ? "使用中" : "已完成"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无课程包数据</p>
            <p className="text-xs mt-1">创建课程包后，财务数据将自动生成</p>
          </div>
        )}
      </div>
    </div>
  );
}
