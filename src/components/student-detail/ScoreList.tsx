"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import {
  ScoreRecord,
  getSemesterLabel,
} from "./shared";

interface ScoreListProps {
  studentId: string;
  refreshKey?: number; // 父组件变更此值触发重新加载
}

// 单条成绩记录渲染
function ScoreRowItem({ r }: { r: ScoreRecord }) {
  const percent = r.fullScore > 0 ? r.score / r.fullScore : 0;
  const scoreColor =
    percent >= 0.85
      ? "text-green-600"
      : percent >= 0.6
      ? "text-shibu-600"
      : "text-red-600";
  const examDate = new Date(r.examDate).toLocaleDateString("zh-CN");
  const rangeText = formatExamRange(r.examRange);

  return (
    <div className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm">
            {r.examName}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-shibu-50 text-shibu-700">
            {r.examType}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {getSemesterLabel(r.semester)}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${scoreColor}`}>{r.score}</span>
          <span className="text-xs text-gray-400">/{r.fullScore}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
        <span>{examDate}</span>
        {r.rank && <span>排名：{r.rank}</span>}
        {rangeText && <span>范围：{rangeText}</span>}
      </div>
      {r.note && (
        <p className="text-xs text-gray-500 mt-1.5">{r.note}</p>
      )}
    </div>
  );
}

// 格式化考试范围显示：examRange 始终展示（不再按 examType 过滤）
function formatExamRange(examRange: string | null): string {
  if (!examRange) return "";
  // examRange 可能是章节 id 数组 join(",") 或文本
  const parts = examRange.split(",").filter(Boolean);
  if (parts.length > 1 && parts.every((p) => p.length > 10)) {
    // 看起来是 id 数组，显示数量
    return `已选 ${parts.length} 章`;
  }
  return examRange;
}

// 学科分组渲染
function ScoreGroup({
  subjectName,
  records,
}: {
  subjectName: string;
  records: ScoreRecord[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-4 h-4 text-shibu-600" />
        <h4 className="text-sm font-semibold text-gray-700">{subjectName}</h4>
        <span className="text-xs text-gray-400">({records.length} 条)</span>
      </div>
      <div className="space-y-2">
        {records.map((r) => (
          <ScoreRowItem key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}

// 按学科分组，保持每组内 examDate DESC（API 已按 examDate DESC 返回）
function groupBySubject(records: ScoreRecord[]): {
  subjectName: string;
  records: ScoreRecord[];
}[] {
  const map = new Map<string, ScoreRecord[]>();
  records.forEach((r) => {
    const key = r.subjectName ?? r.subjectId;
    const arr = map.get(key) ?? [];
    arr.push(r);
    map.set(key, arr);
  });
  const groups: { subjectName: string; records: ScoreRecord[] }[] = [];
  map.forEach((recs, name) => {
    // 每组内按 examDate DESC（API 已排序，但分组后再次确认）
    recs.sort(
      (a, b) =>
        new Date(b.examDate).getTime() - new Date(a.examDate).getTime()
    );
    groups.push({ subjectName: name, records: recs });
  });
  return groups;
}

export default function ScoreList({ studentId, refreshKey }: ScoreListProps) {
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScores = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${sid}/scores`);
      const data = await res.json();
      setRecords(data.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载成绩列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (studentId) void loadScores(studentId);
  }, [studentId, refreshKey, loadScores]);

  if (loading) {
    return (
      <div className="flex items-center justify-center text-gray-400 py-10">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        加载成绩列表...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <p className="text-center text-gray-400 py-10">暂无成绩记录</p>
    );
  }

  const groups = groupBySubject(records);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => void loadScores(studentId)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          <RefreshCw className="w-3 h-3" /> 刷新
        </button>
      </div>
      {groups.map((g) => (
        <ScoreGroup
          key={g.subjectName}
          subjectName={g.subjectName}
          records={g.records}
        />
      ))}
    </div>
  );
}
