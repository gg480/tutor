"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  TrendingUp, DollarSign, Users, Calendar, BarChart3, CreditCard,
} from "lucide-react";

interface MonthlyRow {
  month: string;
  revenue: number;
  courses: number;
  newSignups: number;
  newValue: number;
}

interface RevenueData {
  monthlyData: MonthlyRow[];
  totals: { totalRevenue: number; totalCourses: number; totalSignups: number; totalValue: number };
  prepaymentBalance: number;
  lastUpdated: string;
}

export default function RevenuePage() {
  const { status } = useSession();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/revenue");
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  if (!data) return <div className="text-center py-20 text-gray-400">暂无数据</div>;

  const { monthlyData, totals, prepaymentBalance } = data;
  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-shibu-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">月度收入报表</h1>
          <p className="text-sm text-gray-500 mt-1">按课程消耗确认的收入 · 新增签约</p>
        </div>
      </div>

      {/* 总计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "累计确认收入", value: `¥${totals.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
          { label: "已完成课程", value: totals.totalCourses, icon: Calendar, color: "bg-blue-50 text-blue-600" },
          { label: "新增签约数", value: totals.totalSignups, icon: Users, color: "bg-purple-50 text-purple-600" },
          { label: "签约总额", value: `¥${totals.totalValue.toLocaleString()}`, icon: CreditCard, color: "bg-orange-50 text-orange-600" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{card.label}</span>
                <div className={`p-1.5 rounded-lg ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* 预收款余额 */}
      <div className="bg-gradient-to-r from-shibu-50 to-blue-50 rounded-xl p-5 border border-shibu-100 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-shibu-500 mb-1">当前预收款余额（待确认收入）</p>
            <p className="text-2xl font-bold text-shibu-700">¥{prepaymentBalance.toLocaleString()}</p>
          </div>
          <DollarSign className="w-10 h-10 text-shibu-300" />
        </div>
        <p className="text-xs text-shiban-400 mt-2">基于未耗课时的预收款 · 预收款是负债不是利润</p>
      </div>

      {/* 月度明细表 */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">月度明细</h2>
        </div>
        {monthlyData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-50">
                  <th className="text-left px-5 py-3 font-medium">月份</th>
                  <th className="text-right px-5 py-3 font-medium">确认收入</th>
                  <th className="text-center px-5 py-3 font-medium">课程数</th>
                  <th className="text-right px-5 py-3 font-medium">新增签约</th>
                  <th className="text-right px-5 py-3 font-medium">新增金额</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row) => {
                  const barWidth = (row.revenue / maxRevenue) * 100;
                  return (
                    <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{row.month}</td>
                      <td className="px-5 py-3 text-right font-semibold text-green-600">
                        ¥{row.revenue.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center text-gray-600">{row.courses}</td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {row.newSignups > 0 ? `${row.newSignups} 单` : "-"}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {row.newValue > 0 ? `¥${row.newValue.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-5 py-3 w-32">
                        <div className="bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-green-400 h-2 rounded-full"
                            style={{ width: `${Math.max(barWidth, 2)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无月度数据</p>
            <p className="text-xs mt-1">创建课程包并完成课程后，数据将自动生成</p>
          </div>
        )}
      </div>
    </div>
  );
}
