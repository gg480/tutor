"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import {
  TrainingSubjectRecord,
  CourseRecord,
} from "./shared";

interface TrainingScheduleSectionProps {
  studentId: string;
}

// 课程状态中文标签
const COURSE_STATUS_LABELS: Record<string, string> = {
  scheduled: "已排课",
  completed: "已完成",
  cancelled: "已取消",
  absent: "缺勤",
};

// 单条课程记录渲染
function CourseItem({ c }: { c: CourseRecord }) {
  const date = new Date(c.startTime).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const statusLabel = COURSE_STATUS_LABELS[c.status] ?? c.status;
  const statusColor =
    c.status === "completed"
      ? "bg-green-50 text-green-600"
      : c.status === "cancelled" || c.status === "absent"
      ? "bg-red-50 text-red-600"
      : "bg-blue-50 text-blue-600";
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{date}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
          {c.location && (
            <span className="text-xs text-gray-400">@ {c.location}</span>
          )}
        </div>
        {c.teacherNotes && (
          <p className="text-sm text-gray-700 mt-1 truncate">
            {c.teacherNotes}
          </p>
        )}
      </div>
      <span className="text-xs text-gray-400 ml-2 shrink-0">
        {c.duration} 分钟
      </span>
    </div>
  );
}

// 单个培训学科的课程分组
function SubjectScheduleGroup({
  subjectName,
  courses,
}: {
  subjectName: string;
  courses: CourseRecord[];
}) {
  // 按日期倒序
  const sorted = [...courses].sort(
    (a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-4 h-4 text-shibu-600" />
        <h4 className="text-sm font-semibold text-gray-700">{subjectName}</h4>
        <span className="text-xs text-gray-400">({courses.length} 节课)</span>
      </div>
      {courses.length === 0 ? (
        <p className="text-xs text-gray-400 py-2 pl-6">暂无上课记录</p>
      ) : (
        <div className="pl-6">
          {sorted.map((c) => (
            <CourseItem key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

// 加载培训学科列表
async function fetchTrainingSubjects(
  studentId: string
): Promise<TrainingSubjectRecord[]> {
  const res = await fetch(`/api/students/${studentId}/training-subjects`);
  const data = await res.json();
  return (data.data ?? []) as TrainingSubjectRecord[];
}

// 加载学生所有课程
async function fetchCourses(studentId: string): Promise<CourseRecord[]> {
  const res = await fetch(`/api/courses?studentId=${encodeURIComponent(studentId)}`);
  const data = await res.json();
  return (data.data ?? []) as CourseRecord[];
}

// 按培训学科分组课程（用 subjectName 匹配 Course.subject 字符串字段）
function groupCoursesByTraining(
  trainings: TrainingSubjectRecord[],
  courses: CourseRecord[]
): { subjectName: string; courses: CourseRecord[] }[] {
  // 仅展示在读（active）培训学科
  const activeTrainings = trainings.filter((t) => t.status === "active");
  return activeTrainings.map((t) => {
    const subjectName = t.subjectName ?? "";
    const matched = courses.filter((c) => c.subject === subjectName);
    return { subjectName: subjectName || t.subjectId, courses: matched };
  });
}

export default function TrainingScheduleSection({
  studentId,
}: TrainingScheduleSectionProps) {
  const [groups, setGroups] = useState<
    { subjectName: string; courses: CourseRecord[] }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadAll(studentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const loadAll = async (sid: string) => {
    setLoading(true);
    try {
      const [trainings, courses] = await Promise.all([
        fetchTrainingSubjects(sid),
        fetchCourses(sid),
      ]);
      setGroups(groupCoursesByTraining(trainings, courses));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载培训日程失败");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-center text-gray-400">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        加载培训日程...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-shibu-50">
        <Calendar className="w-4 h-4 text-shibu-600" />
        <h3 className="text-sm font-semibold text-shibu-700">培训日程</h3>
        <span className="ml-auto text-xs text-gray-500">
          {groups.length} 个培训学科
        </span>
      </div>
      <div className="p-4">
        {groups.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">
            暂无培训学科
          </p>
        ) : (
          <div className="space-y-5">
            {groups.map((g) => (
              <SubjectScheduleGroup
                key={g.subjectName}
                subjectName={g.subjectName}
                courses={g.courses}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
