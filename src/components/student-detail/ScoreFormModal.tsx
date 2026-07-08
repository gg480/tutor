"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  EXAM_TYPE_SUGGESTIONS,
  SEMESTER_OPTIONS,
  INPUT_CLASS,
  LABEL_CLASS,
  SubjectOption,
  GradeOption,
} from "./shared";
import ExamRangeSelector from "./ExamRangeSelector";

interface ScoreFormModalProps {
  studentId: string;
  gradeId: string;
  onClose: () => void;
  onSaved: () => void;
}

interface ScoreFormState {
  examName: string;
  examType: string;
  semester: string;
  subjectId: string;
  score: string;
  fullScore: string;
  rank: string;
  examDate: string;
  examRange: string[];
  note: string;
}

// 获取今日日期 yyyy-mm-dd
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

// 构造初始表单状态
function buildInitialForm(): ScoreFormState {
  return {
    examName: "",
    examType: "周测",
    semester: "first",
    subjectId: "",
    score: "",
    fullScore: "100",
    rank: "",
    examDate: getTodayStr(),
    examRange: [],
    note: "",
  };
}

// 表单字段渲染子组件，避免主组件函数过长
function ScoreFormFields({
  form,
  setForm,
  subjects,
  gradeId,
  subjectsLoading,
}: {
  form: ScoreFormState;
  setForm: (next: ScoreFormState) => void;
  subjects: SubjectOption[];
  gradeId: string;
  subjectsLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>
            考试名称 <span className="text-red-500">*</span>
          </label>
          <input
            value={form.examName}
            onChange={(e) => setForm({ ...form, examName: e.target.value })}
            className={INPUT_CLASS}
            placeholder="如：第一单元周测"
            required
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>
            考试类型 <span className="text-red-500">*</span>
          </label>
          <input
            list="examTypeSuggestions"
            value={form.examType}
            onChange={(e) => setForm({ ...form, examType: e.target.value })}
            className={INPUT_CLASS}
            placeholder="如：周测、月考、期中"
            required
          />
          <datalist id="examTypeSuggestions">
            {EXAM_TYPE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>
            学科 <span className="text-red-500">*</span>
          </label>
          {subjectsLoading ? (
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
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className={LABEL_CLASS}>
            学期 <span className="text-red-500">*</span>
          </label>
          <select
            value={form.semester}
            onChange={(e) =>
              setForm({ ...form, semester: e.target.value })
            }
            className={INPUT_CLASS}
            required
          >
            {SEMESTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={LABEL_CLASS}>
            日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.examDate}
            onChange={(e) => setForm({ ...form, examDate: e.target.value })}
            className={INPUT_CLASS}
            required
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>
            分数 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.5"
            value={form.score}
            onChange={(e) => setForm({ ...form, score: e.target.value })}
            className={INPUT_CLASS}
            required
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>满分</label>
          <input
            type="number"
            step="1"
            value={form.fullScore}
            onChange={(e) => setForm({ ...form, fullScore: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
      </div>
      <div>
        <label className={LABEL_CLASS}>排名</label>
        <input
          value={form.rank}
          onChange={(e) => setForm({ ...form, rank: e.target.value })}
          className={INPUT_CLASS}
          placeholder="如：5/40"
        />
      </div>
      {form.subjectId ? (
        <ExamRangeSelector
          gradeId={gradeId}
          subjectId={form.subjectId}
          value={form.examRange}
          onChange={(ids) => setForm({ ...form, examRange: ids })}
        />
      ) : (
        <p className="text-xs text-gray-400">请先选择学科以加载章节范围</p>
      )}
      <div>
        <label className={LABEL_CLASS}>备注</label>
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className={INPUT_CLASS}
          rows={2}
          placeholder="可选"
        />
      </div>
    </div>
  );
}

export default function ScoreFormModal({
  studentId,
  gradeId,
  onClose,
  onSaved,
}: ScoreFormModalProps) {
  const [form, setForm] = useState<ScoreFormState>(buildInitialForm);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadSubjects(gradeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeId]);

  const loadSubjects = async (gid: string) => {
    setSubjectsLoading(true);
    try {
      const list = await fetchSubjectsByGrade(gid);
      setSubjects(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载学科失败");
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.examName || !form.subjectId || !form.examDate || !form.score) {
      toast.error("请填写必填字段");
      return;
    }
    if (!form.examType.trim()) {
      toast.error("请填写考试类型");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        examName: form.examName,
        examType: form.examType.trim(),
        semester: form.semester,
        subjectId: form.subjectId,
        score: Number(form.score),
        fullScore: Number(form.fullScore) || 100,
        rank: form.rank || undefined,
        examDate: form.examDate,
        examRange: form.examRange.length > 0 ? form.examRange.join(",") : null,
        note: form.note || undefined,
      };
      const res = await fetch(`/api/students/${studentId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "创建失败");
      toast.success("成绩已录入");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建成绩失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">新增成绩</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <ScoreFormFields
            form={form}
            setForm={setForm}
            subjects={subjects}
            gradeId={gradeId}
            subjectsLoading={subjectsLoading}
          />
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
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
