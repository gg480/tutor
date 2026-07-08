"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  EXAM_TYPE_SUGGESTIONS,
  SEMESTER_OPTIONS,
  INPUT_CLASS,
  LABEL_CLASS,
  SubjectOption,
  GradeOption,
} from "./shared";

interface ScoreBatchFormProps {
  studentId: string;
  gradeId: string;
  onClose: () => void;
  onSaved: () => void;
}

interface BatchRow {
  key: number;
  subjectId: string;
  score: string;
  fullScore: string;
  rank: string;
  note: string;
}

interface BatchHeader {
  examName: string;
  examType: string;
  semester: string;
  examDate: string;
  examRange: string;
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

function buildInitialHeader(): BatchHeader {
  return {
    examName: "",
    examType: "周测",
    semester: "first",
    examDate: getTodayStr(),
    examRange: "",
  };
}

function buildEmptyRow(seq: number): BatchRow {
  return {
    key: seq,
    subjectId: "",
    score: "",
    fullScore: "100",
    rank: "",
    note: "",
  };
}

// 单行成绩输入
function BatchRowItem({
  row,
  subjects,
  onChange,
  onRemove,
  canRemove,
}: {
  row: BatchRow;
  subjects: SubjectOption[];
  onChange: (next: BatchRow) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <select
        value={row.subjectId}
        onChange={(e) => onChange({ ...row, subjectId: e.target.value })}
        className={`${INPUT_CLASS} col-span-3`}
        required
      >
        <option value="">选学科</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.5"
        value={row.score}
        onChange={(e) => onChange({ ...row, score: e.target.value })}
        className={`${INPUT_CLASS} col-span-2`}
        placeholder="分数"
        required
      />
      <input
        type="number"
        step="1"
        value={row.fullScore}
        onChange={(e) => onChange({ ...row, fullScore: e.target.value })}
        className={`${INPUT_CLASS} col-span-2`}
        placeholder="满分"
      />
      <input
        value={row.rank}
        onChange={(e) => onChange({ ...row, rank: e.target.value })}
        className={`${INPUT_CLASS} col-span-2`}
        placeholder="排名"
      />
      <input
        value={row.note}
        onChange={(e) => onChange({ ...row, note: e.target.value })}
        className={`${INPUT_CLASS} col-span-2`}
        placeholder="备注"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="col-span-1 mt-1 text-red-400 hover:text-red-600 disabled:opacity-30"
        aria-label="删除该行"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ScoreBatchForm({
  studentId,
  gradeId,
  onClose,
  onSaved,
}: ScoreBatchFormProps) {
  const [header, setHeader] = useState<BatchHeader>(buildInitialHeader);
  const [rows, setRows] = useState<BatchRow[]>([buildEmptyRow(1)]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [seqRef, setSeqRef] = useState(1);

  useEffect(() => {
    void loadSubjects(gradeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeId]);

  const loadSubjects = async (gid: string) => {
    try {
      const list = await fetchSubjectsByGrade(gid);
      setSubjects(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载学科失败");
    }
  };

  const addRow = () => {
    const nextSeq = seqRef + 1;
    setSeqRef(nextSeq);
    setRows([...rows, buildEmptyRow(nextSeq)]);
  };

  const updateRow = (key: number, next: BatchRow) => {
    setRows(rows.map((r) => (r.key === key ? next : r)));
  };

  const removeRow = (key: number) => {
    setRows(rows.filter((r) => r.key !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!header.examName || !header.examDate) {
      toast.error("请填写考试名称和日期");
      return;
    }
    if (!header.examType.trim()) {
      toast.error("请填写考试类型");
      return;
    }
    const validRows = rows.filter((r) => r.subjectId && r.score);
    if (validRows.length === 0) {
      toast.error("请至少填写一行完整成绩");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        examName: header.examName,
        examType: header.examType.trim(),
        semester: header.semester,
        examDate: header.examDate,
        examRange: header.examRange.trim() || null,
        records: validRows.map((r) => ({
          subjectId: r.subjectId,
          score: Number(r.score),
          fullScore: Number(r.fullScore) || 100,
          rank: r.rank || undefined,
          note: r.note || undefined,
        })),
      };
      const res = await fetch(`/api/students/${studentId}/scores/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "批量录入失败");
      toast.success(`已批量录入 ${data.inserted ?? validRows.length} 条`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "批量录入失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">批量录入成绩</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>
                  考试名称 <span className="text-red-500">*</span>
                </label>
                <input
                  value={header.examName}
                  onChange={(e) =>
                    setHeader({ ...header, examName: e.target.value })
                  }
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>
                  考试类型 <span className="text-red-500">*</span>
                </label>
                <input
                  list="batchExamTypeSuggestions"
                  value={header.examType}
                  onChange={(e) =>
                    setHeader({ ...header, examType: e.target.value })
                  }
                  className={INPUT_CLASS}
                  placeholder="如：周测、月考、期中"
                  required
                />
                <datalist id="batchExamTypeSuggestions">
                  {EXAM_TYPE_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL_CLASS}>
                  学期 <span className="text-red-500">*</span>
                </label>
                <select
                  value={header.semester}
                  onChange={(e) =>
                    setHeader({ ...header, semester: e.target.value })
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
              <div>
                <label className={LABEL_CLASS}>
                  日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={header.examDate}
                  onChange={(e) =>
                    setHeader({ ...header, examDate: e.target.value })
                  }
                  className={INPUT_CLASS}
                  required
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>考试范围（可选）</label>
                <input
                  value={header.examRange}
                  onChange={(e) =>
                    setHeader({ ...header, examRange: e.target.value })
                  }
                  className={INPUT_CLASS}
                  placeholder="如：第1-3章"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              批量录入多学科时，考试范围用文本描述（章节树多选请用单条录入）
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                成绩行（{rows.length} 行）
              </span>
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1 text-sm text-shibu-600 hover:text-shibu-700"
              >
                <Plus className="w-4 h-4" /> 添加一行
              </button>
            </div>
            {rows.map((row) => (
              <BatchRowItem
                key={row.key}
                row={row}
                subjects={subjects}
                onChange={(next) => updateRow(row.key, next)}
                onRemove={() => removeRow(row.key)}
                canRemove={rows.length > 1}
              />
            ))}
          </div>

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
              disabled={submitting}
              className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700 disabled:opacity-50"
            >
              {submitting ? "提交中..." : "批量保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
