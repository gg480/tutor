"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, X, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import {
  TrainingSubjectRecord,
  SubjectOption,
  GradeOption,
  TRAINING_STATUS_LABELS,
  INPUT_CLASS,
  LABEL_CLASS,
} from "./shared";

interface TrainingSubjectSectionProps {
  studentId: string;
  gradeId: string;
  onTrainingSubjectsChange?: (trainingSubjectIds: string[]) => void;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// 反查年级 level 后加载可选学科列表
async function fetchSubjectsByGrade(
  gradeId: string
): Promise<SubjectOption[]> {
  const gRes = await fetch(`/api/master-data/grades/${gradeId}`);
  const gData = await gRes.json();
  const grade = gData.data as GradeOption | null;
  if (!grade) return [];
  const sRes = await fetch(
    `/api/master-data/subjects?level=${encodeURIComponent(grade.level)}`
  );
  const sData = await sRes.json();
  return (sData.data ?? []) as SubjectOption[];
}

// 新增培训学科弹窗
function AddTrainingSubjectModal({
  gradeId,
  existingSubjectIds,
  onClose,
  onAdd,
}: {
  gradeId: string;
  existingSubjectIds: string[];
  onClose: () => void;
  onAdd: (subjectId: string, isAtStudio: boolean, startDate: string) => Promise<void>;
}) {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subjectId: "",
    isAtStudio: true,
    startDate: getTodayStr(),
  });

  useEffect(() => {
    void loadSubjects(gradeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeId]);

  const loadSubjects = async (gid: string) => {
    setLoading(true);
    try {
      const list = await fetchSubjectsByGrade(gid);
      setSubjects(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载学科失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId) {
      toast.error("请选择学科");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(form.subjectId, form.isAtStudio, form.startDate);
    } finally {
      setSubmitting(false);
    }
  };

  const availableSubjects = subjects.filter(
    (s) => !existingSubjectIds.includes(s.id)
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">添加培训学科</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>
              学科 <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="flex items-center text-xs text-gray-400 py-2">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> 加载学科...
              </div>
            ) : (
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className={INPUT_CLASS}
                required
              >
                <option value="">请选择学科</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            {availableSubjects.length === 0 && !loading && (
              <p className="text-xs text-gray-400 mt-1">
                该年级所有学科均已标记为培训学科
              </p>
            )}
          </div>
          <div>
            <label className={LABEL_CLASS}>开始日期</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isAtStudio}
              onChange={(e) => setForm({ ...form, isAtStudio: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-shibu-600 focus:ring-shibu-500"
            />
            在工作室上课
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !form.subjectId}
              className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700 disabled:opacity-50"
            >
              {submitting ? "提交中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 单条培训学科记录
function TrainingSubjectRow({
  r,
  onEnd,
  onResume,
  busy,
}: {
  r: TrainingSubjectRecord;
  onEnd: () => void;
  onResume: () => void;
  busy: boolean;
}) {
  const isActive = r.status === "active";
  const startDate = new Date(r.startDate).toLocaleDateString("zh-CN");
  const endDate = r.endDate
    ? new Date(r.endDate).toLocaleDateString("zh-CN")
    : "—";
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-900">
          {r.subjectName ?? r.subjectId}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isActive
              ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {TRAINING_STATUS_LABELS[r.status] ?? r.status}
        </span>
        {r.isAtStudio && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-shibu-50 text-shibu-700">
            工作室
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>开始：{startDate}</span>
        <span>结束：{endDate}</span>
        {isActive ? (
          <button
            onClick={onEnd}
            disabled={busy}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            结课
          </button>
        ) : (
          <button
            onClick={onResume}
            disabled={busy}
            className="px-2 py-1 text-xs bg-shibu-50 text-shibu-700 rounded hover:bg-shibu-100 disabled:opacity-50"
          >
            恢复在读
          </button>
        )}
      </div>
    </div>
  );
}

export default function TrainingSubjectSection({
  studentId,
  gradeId,
  onTrainingSubjectsChange,
}: TrainingSubjectSectionProps) {
  const [list, setList] = useState<TrainingSubjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadList = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${sid}/training-subjects`);
      const data = await res.json();
      setList(data.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载培训学科失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (studentId) void loadList(studentId);
  }, [studentId, loadList]);

  // 通知父组件培训学科 subjectId 列表变化（用于成绩曲线高亮）
  useEffect(() => {
    if (onTrainingSubjectsChange) {
      onTrainingSubjectsChange(list.map((r) => r.subjectId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  const handleAdd = async (subjectId: string, isAtStudio: boolean, startDate: string) => {
    try {
      const res = await fetch(`/api/students/${studentId}/training-subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, isAtStudio, startDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "添加失败");
      toast.success("培训学科已添加");
      setShowModal(false);
      void loadList(studentId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "添加培训学科失败");
    }
  };

  const updateStatus = async (recordId: string, status: string) => {
    setBusyId(recordId);
    try {
      const res = await fetch(
        `/api/students/${studentId}/training-subjects/${recordId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新失败");
      toast.success(status === "ended" ? "已结课" : "已恢复在读");
      void loadList(studentId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新培训学科失败");
    } finally {
      setBusyId(null);
    }
  };

  const existingSubjectIds = list.map((r) => r.subjectId);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-shibu-50">
        <GraduationCap className="w-4 h-4 text-shibu-600" />
        <h3 className="text-sm font-semibold text-shibu-700">培训学科</h3>
        <span className="ml-auto text-xs text-gray-500">
          共 {list.length} 科
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 text-xs px-2 py-1 bg-shibu-600 text-white rounded hover:bg-shibu-700"
        >
          <Plus className="w-3 h-3" /> 添加
        </button>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center text-gray-400 py-6">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            加载培训学科...
          </div>
        ) : list.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">
            暂无培训学科，点击右上角&ldquo;添加&rdquo;
          </p>
        ) : (
          list.map((r) => (
            <TrainingSubjectRow
              key={r.id}
              r={r}
              onEnd={() => void updateStatus(r.id, "ended")}
              onResume={() => void updateStatus(r.id, "active")}
              busy={busyId === r.id}
            />
          ))
        )}
      </div>
      {showModal && (
        <AddTrainingSubjectModal
          gradeId={gradeId}
          existingSubjectIds={existingSubjectIds}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
