"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Plus, Search, MoreHorizontal, Clock, BookOpen, Trash2, Download, CheckSquare } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ListSkeleton } from "@/components/Skeleton";
import ConfirmDialog from "@/components/ConfirmDialog";
import toast from "react-hot-toast";

interface Student {
  id: string;
  name: string;
  gradeId: string;
  schoolId: string | null;
  gradeName: string;
  schoolName: string | null;
  parentName: string | null;
  status: string;
  createdAt: string;
  courses: { id: string; startTime: string; subject: string }[];
  courseRegistrations: { remainingHours: number; totalHours: number }[];
}

export default function StudentsPage() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDelete, setShowBatchDelete] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [gradeFilter, setGradeFilter] = useState("");

  const fetchStudents = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (gradeFilter) params.set("grade", gradeFilter);
      const url = `/api/students?${params}`;
      const res = await fetch(url);
      const data = await res.json();
      setStudents(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [gradeFilter]);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchStudents();
  }, [status, gradeFilter, fetchStudents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(searchQ);
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理所有学生档案和学情数据
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export?type=students"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            📥 导出CSV
          </a>
          <Link
            href="/dashboard/import"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            📥 批量导入
          </Link>
          <Link
            href="/dashboard/students/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            新建学生
          </Link>
        </div>
      </div>

      {/* 搜索栏 */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="搜索学生姓名、学校..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </form>

      {/* 年级快速筛选 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "小四","小五","小六","初一","初二","初三","高一","高二","高三"].map((g) => (
          <button key={g || "all"} onClick={() => setGradeFilter(g)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              gradeFilter === g
                ? "bg-shibu-600 text-white border-shibu-600"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}>
            {g || "全部"}
          </button>
        ))}
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-shibu-50 rounded-lg border border-shibu-100">
          <CheckSquare className="w-4 h-4 text-shibu-600" />
          <span className="text-sm text-shibu-700 font-medium">已选择 {selectedIds.size} 名学生</span>
          <div className="flex gap-2 ml-auto">
            <a
              href={`/api/export?type=students&ids=${Array.from(selectedIds).join(",")}`}
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-shibu-600 rounded-lg text-xs hover:bg-shibu-50 border border-shibu-200"
            >
              <Download className="w-3 h-3" /> 导出选中
            </a>
            <button
              onClick={() => setShowBatchDelete(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100"
            >
              <Trash2 className="w-3 h-3" /> 删除选中
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {/* 学生列表 */}
      {loading ? (
        <ListSkeleton />
      ) : students.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-lg">还没有学生</p>
          <p className="text-sm mt-1">点击「新建学生」开始建档</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* 全选 */}
          {students.length > 0 && (
            <label className="flex items-center gap-2 px-1 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === students.length}
                onChange={(e) => {
                  setSelectedIds(e.target.checked ? new Set(students.map((s) => s.id)) : new Set());
                }}
                className="w-4 h-4 rounded border-gray-300 text-shibu-600 focus:ring-shibu-500"
              />
              <span className="text-xs text-gray-400">全选 {students.length} 名学生</span>
            </label>
          )}
          {students.map((student) => {
            const nextCourse = student.courses?.[0];
            const registration = student.courseRegistrations?.[0];
            return (
              <div key={student.id} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* 复选框 */}
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(student.id);
                        else next.delete(student.id);
                        setSelectedIds(next);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-shibu-600 focus:ring-shibu-500"
                    />
                  </div>
                  {/* 头像 -> 可点击跳转 */}
                  <Link href={`/dashboard/students/${student.id}`} className="w-12 h-12 rounded-full bg-shibu-100 text-shibu-600 flex items-center justify-center text-lg font-bold shrink-0">
                    {student.name[0]}
                  </Link>
                  {/* 信息 */}
                  <Link href={`/dashboard/students/${student.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 hover:text-shibu-600">
                      {student.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span>{student.gradeName}</span>
                      {student.schoolName && <span>· {student.schoolName}</span>}
                      {student.parentName && (
                        <span>· {student.parentName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        建档 {formatDate(student.createdAt)}
                      </span>
                      {registration && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          剩余 {registration.remainingHours}/{registration.totalHours} 课时
                        </span>
                      )}
                    </div>
                  </Link>
                </div>

                {/* 状态标签 */}
                <div className="flex items-center gap-3">
                  {nextCourse && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                      下一节: {nextCourse.subject}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      student.status === "active"
                        ? "bg-green-50 text-green-600"
                        : student.status === "paused"
                        ? "bg-yellow-50 text-yellow-600"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {student.status === "active"
                      ? "在读"
                      : student.status === "paused"
                      ? "暂停"
                      : "已结课"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 批量删除确认 */}
      <ConfirmDialog
        open={showBatchDelete}
        title={`删除 ${selectedIds.size} 名学生`}
        message={`确定要删除选中的 ${selectedIds.size} 名学生吗？此操作不可恢复，包括所有学情、错题、成绩和课程数据。`}
        confirmText="确认删除"
        variant="danger"
        loading={batchDeleting}
        onConfirm={async () => {
          setBatchDeleting(true);
          try {
            for (const id of selectedIds) {
              await fetch(`/api/students/${id}`, { method: "DELETE" });
            }
            toast.success(`成功删除 ${selectedIds.size} 名学生`);
            setSelectedIds(new Set());
            fetchStudents();
          } catch (err) {
            toast.error("部分删除失败");
          } finally {
            setBatchDeleting(false);
            setShowBatchDelete(false);
          }
        }}
        onCancel={() => setShowBatchDelete(false)}
      />
    </div>
  );
}
