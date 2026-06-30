"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { PageSkeleton } from "@/components/Skeleton";

interface Course {
  id: string;
  studentId: string;
  subject: string;
  courseType: string;
  startTime: string;
  endTime: string;
  status: string;
  student: { id: string; name: string; grade: string };
  attendance: { status: string } | null;
}

interface Student {
  id: string;
  name: string;
  grade: string;
}

export default function CoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showNewForm, setShowNewForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  const [batchForm, setBatchForm] = useState({
    studentId: "", subject: "", courseType: "normal", duration: "120", location: "",
    startDate: "", endDate: "", time: "10:00",
    weekdays: [] as number[],
  });
  const [form, setForm] = useState({
    studentId: "",
    subject: "",
    courseType: "normal",
    startTime: "",
    duration: "120",
    location: "",
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") {
      fetchCourses();
      fetchStudents();
    }
  }, [status, currentWeek]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
      });
      const res = await fetch(`/api/courses?${params}`);
      const data = await res.json();
      setCourses(data.data || []);
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

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.subject || !form.startTime) {
      toast.error("请填写完整信息");
      return;
    }

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          duration: parseInt(form.duration),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      toast.success("课程已创建");
      setShowNewForm(false);
      setForm({
        studentId: "",
        subject: "",
        courseType: "normal",
        startTime: "",
        duration: "120",
        location: "",
      });
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCompleteCourse = async (courseId: string, studentId?: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!res.ok) throw new Error("操作失败");
      toast.success("课程已完成并扣课，即将跳转记录学情");
      fetchCourses();
      // 签到完成后自动跳转到学情记录页并弹出记录窗口
      if (studentId) {
        setTimeout(() => {
          router.push(`/dashboard/records?studentId=${studentId}&recordFor=${studentId}`);
        }, 1000);
      }
    } catch (err) {
      toast.error("操作失败");
    }
  };

  const daysOfWeek = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">排课日历</h1>
          <p className="text-sm text-gray-500 mt-1">管理课程安排</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/calendar"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
            📅 导出日历
          </a>
          <button onClick={() => setShowBatchForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-shibu-300 text-shibu-700 rounded-lg hover:bg-shibu-50 transition text-sm font-medium">
            📅 批量排课
          </button>
          <button onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> 新建课程
          </button>
        </div>
      </div>

      {/* 周切换 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-lg font-semibold text-gray-700">
          {format(weekStart, "M月d日", { locale: zhCN })} ~{" "}
          {format(weekEnd, "M月d日", { locale: zhCN })}
        </h2>
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 批量签到栏 */}
      {selectedCourseIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-green-50 rounded-lg border border-green-200">
          <span className="text-sm text-green-700 font-medium">已选择 {selectedCourseIds.size} 节课</span>
          <button onClick={async () => {
            try {
              const res = await fetch("/api/courses/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseIds: Array.from(selectedCourseIds) }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              toast.success(data.message || "批量签到成功");
              setSelectedCourseIds(new Set());
              fetchCourses();
            } catch (err: any) { toast.error(err.message); }
          }}
            className="ml-auto px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700">
            批量签到
          </button>
          <button onClick={() => setSelectedCourseIds(new Set())}
            className="text-xs text-gray-500 hover:text-gray-700">
            取消
          </button>
        </div>
      )}

      {/* 课程列表（按天分组） */}
      {loading ? (
        <PageSkeleton />
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📅</div>
          <p>本周没有课程安排</p>
        </div>
      ) : (
        <div className="space-y-4">
          {daysOfWeek.map((dayName, index) => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + index);
            const dayCourses = courses.filter((c) => {
              const cDate = new Date(c.startTime);
              return cDate.getDate() === dayDate.getDate() &&
                cDate.getMonth() === dayDate.getMonth() &&
                cDate.getFullYear() === dayDate.getFullYear();
            });

            const dateStr = format(dayDate, "M/d");

            return (
              <div key={index} className="bg-white rounded-xl border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-50">
                  <span className="text-sm font-medium text-gray-700">
                    {dayName} {dateStr}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {dayCourses.length}节课
                  </span>
                </div>
                {dayCourses.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {dayCourses.map((course) => (
                      <div
                        key={course.id}
                        className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          {/* 复选框（仅待上课） */}
                          {course.status === "scheduled" && (
                            <input type="checkbox" checked={selectedCourseIds.has(course.id)}
                              onChange={(e) => {
                                const next = new Set(selectedCourseIds);
                                if (e.target.checked) next.add(course.id);
                                else next.delete(course.id);
                                setSelectedCourseIds(next);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-green-600" />
                          )}
                          <div className="text-sm font-medium text-shibu-600 w-20">
                            {format(new Date(course.startTime), "HH:mm")}-
                            {format(new Date(course.endTime), "HH:mm")}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {course.student.name}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              {course.subject}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              {course.courseType === "competition"
                                ? "竞赛"
                                : "常规"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              course.status === "completed"
                                ? "bg-green-50 text-green-600"
                                : course.status === "scheduled"
                                ? "bg-blue-50 text-blue-600"
                                : course.status === "cancelled"
                                ? "bg-red-50 text-red-600"
                                : "bg-gray-50 text-gray-500"
                            }`}
                          >
                            {course.status === "completed"
                              ? "已完成"
                              : course.status === "scheduled"
                              ? "待上课"
                              : course.status === "cancelled"
                              ? "已取消"
                              : "缺课"}
                          </span>
                          {course.status === "scheduled" && (
                            <button
                              onClick={() => handleCompleteCourse(course.id, course.student.id)}
                              className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                            >
                              签到完成
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-300">
                    没有课程
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 新建课程弹窗 */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              新建课程
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    科目
                  </label>
                  <input
                    value={form.subject}
                    onChange={(e) =>
                      setForm({ ...form, subject: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="如：数学"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    类型
                  </label>
                  <select
                    value={form.courseType}
                    onChange={(e) =>
                      setForm({ ...form, courseType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="normal">常规课</option>
                    <option value="competition">竞赛课</option>
                    <option value="trial">试听课</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    时长（分钟）
                  </label>
                  <select
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="60">60 分钟</option>
                    <option value="90">90 分钟</option>
                    <option value="120">120 分钟</option>
                    <option value="150">150 分钟</option>
                    <option value="180">180 分钟</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  地点
                </label>
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="工作室/线上"
                />
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
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 批量排课弹窗 */}
      {showBatchForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">批量排课</h3>
              <button onClick={() => setShowBatchForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学生</label>
                  <select value={batchForm.studentId} onChange={(e) => setBatchForm({...batchForm, studentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required>
                    <option value="">选择学生</option>
                    {students.map((s: any) => <option key={s.id} value={s.id}>{s.name}（{s.grade}）</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
                  <input value={batchForm.subject} onChange={(e) => setBatchForm({...batchForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="数学" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <input type="date" value={batchForm.startDate} onChange={(e) => setBatchForm({...batchForm, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <input type="date" value={batchForm.endDate} onChange={(e) => setBatchForm({...batchForm, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">每周上课</label>
                <div className="flex gap-2">
                  {["一","二","三","四","五","六","日"].map((day, i) => {
                    const dayNum = i + 1;
                    const selected = batchForm.weekdays.includes(dayNum);
                    return (
                      <button key={day} type="button" onClick={() => {
                        setBatchForm({...batchForm, weekdays: selected ? batchForm.weekdays.filter(d => d !== dayNum) : [...batchForm.weekdays, dayNum]});
                      }}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition ${selected ? "bg-shibu-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">上课时间</label>
                  <input type="time" value={batchForm.time} onChange={(e) => setBatchForm({...batchForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">时长</label>
                  <select value={batchForm.duration} onChange={(e) => setBatchForm({...batchForm, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="60">60分钟</option>
                    <option value="90">90分钟</option>
                    <option value="120">120分钟</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowBatchForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
                <button type="button" onClick={async () => {
                  if (!batchForm.studentId || !batchForm.subject || !batchForm.startDate || !batchForm.endDate || batchForm.weekdays.length === 0) {
                    toast.error("请填写完整信息"); return;
                  }
                  try {
                    const res = await fetch("/api/courses/batch", { method: "POST",
                      headers: { "Content-Type": "application/json" }, body: JSON.stringify(batchForm) });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    toast.success(data.message || "批量排课成功");
                    setShowBatchForm(false);
                    fetchCourses();
                  } catch (err: any) { toast.error(err.message); }
                }}
                  className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700">确认批量创建</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
