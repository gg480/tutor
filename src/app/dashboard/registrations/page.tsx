"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, RefreshCw, Package } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Registration {
  id: string;
  studentId: string;
  packageName: string;
  totalHours: number;
  usedHours: number;
  remainingHours: number;
  price: number | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string;
  student: { id: string; name: string; grade: string };
}

interface Student {
  id: string;
  name: string;
  grade: string;
}

export default function RegistrationsPage() {
  const { status } = useSession();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showRenewForm, setShowRenewForm] = useState<string | null>(null);
  const [form, setForm] = useState({
    studentId: "",
    packageName: "",
    totalHours: "",
    price: "",
    startDate: "",
    endDate: "",
  });
  const [renewForm, setRenewForm] = useState({ addHours: "", addPrice: "" });

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") {
      fetchRegistrations();
      fetchStudents();
    }
  }, [status]);

  const fetchRegistrations = async () => {
    try {
      const res = await fetch("/api/registrations");
      const data = await res.json();
      setRegistrations(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students?status=active");
      const data = await res.json();
      setStudents(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.packageName || !form.totalHours) {
      toast.error("请填写完整信息");
      return;
    }

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("创建失败");

      toast.success("课程包已创建");
      setShowNewForm(false);
      setForm({
        studentId: "",
        packageName: "",
        totalHours: "",
        price: "",
        startDate: "",
        endDate: "",
      });
      fetchRegistrations();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRenew = async (id: string) => {
    if (!renewForm.addHours) {
      toast.error("请输入续费课时");
      return;
    }

    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(renewForm),
      });

      if (!res.ok) throw new Error("续费失败");

      toast.success("续费成功！");
      setShowRenewForm(null);
      setRenewForm({ addHours: "", addPrice: "" });
      fetchRegistrations();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">课程包管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理学生的课时包、续费和消耗
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 新建课程包
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>还没有课程包</p>
          <p className="text-sm mt-1">点击「新建课程包」开始</p>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const usagePct =
              reg.totalHours > 0
                ? Math.round((reg.usedHours / reg.totalHours) * 100)
                : 0;
            return (
              <div
                key={reg.id}
                className="bg-white rounded-xl p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {reg.packageName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {reg.student.name} · {reg.student.grade}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      reg.status === "active"
                        ? "bg-green-50 text-green-600"
                        : reg.status === "completed"
                        ? "bg-gray-50 text-gray-500"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {reg.status === "active"
                      ? "使用中"
                      : reg.status === "completed"
                      ? "已完成"
                      : "已退款"}
                  </span>
                </div>

                {/* 课时进度 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">
                      课时消耗 {reg.usedHours}/{reg.totalHours}
                    </span>
                    <span className="text-gray-700 font-medium">
                      剩余 {reg.remainingHours} 课时
                    </span>
                    {reg.price && reg.totalHours > 0 && (
                      <span className="text-xs text-gray-400 ml-2">
                        ¥{Math.round(reg.price / reg.totalHours)}/课时
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        usagePct >= 80
                          ? "bg-red-500"
                          : usagePct >= 50
                          ? "bg-confidence-500"
                          : "bg-shibu-500"
                      }`}
                      style={{ width: `${Math.min(usagePct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex gap-4">
                    {reg.price && (
                      <span>总价：¥{reg.price.toLocaleString()}</span>
                    )}
                    {reg.startDate && (
                      <span>开始：{formatDate(reg.startDate)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowRenewForm(reg.id);
                        setRenewForm({ addHours: "", addPrice: "" });
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-shibu-50 text-shibu-600 rounded-lg hover:bg-shibu-100 text-xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                      续费
                    </button>
                  </div>
                </div>

                {/* 续费弹窗（内联） */}
                {showRenewForm === reg.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-end gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          增加课时
                        </label>
                        <input
                          type="number"
                          value={renewForm.addHours}
                          onChange={(e) =>
                            setRenewForm({
                              ...renewForm,
                              addHours: e.target.value,
                            })
                          }
                          className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                          placeholder="课时"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          增加金额
                        </label>
                        <input
                          type="number"
                          value={renewForm.addPrice}
                          onChange={(e) =>
                            setRenewForm({
                              ...renewForm,
                              addPrice: e.target.value,
                            })
                          }
                          className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                          placeholder="金额（元）"
                        />
                      </div>
                      <button
                        onClick={() => handleRenew(reg.id)}
                        className="px-4 py-1.5 bg-shibu-600 text-white rounded-lg text-xs hover:bg-shibu-700"
                      >
                        确认续费
                      </button>
                      <button
                        onClick={() => setShowRenewForm(null)}
                        className="px-3 py-1.5 text-xs text-gray-500"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 新建课程包弹窗 */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              新建课程包
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学生
                </label>
                <select
                  value={form.studentId}
                  onChange={(e) =>
                    setForm({ ...form, studentId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required
                >
                  <option value="">选择学生</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}（{s.grade}）
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  课程包名称
                </label>
                <input
                  value={form.packageName}
                  onChange={(e) =>
                    setForm({ ...form, packageName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder='如："初一数学48课时包"'
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    总课时
                  </label>
                  <input
                    type="number"
                    value={form.totalHours}
                    onChange={(e) =>
                      setForm({ ...form, totalHours: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    总价（元）
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm"
                >
                  创建课程包
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
