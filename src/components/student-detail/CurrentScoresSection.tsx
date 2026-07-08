"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  ScoreRecord,
  TrainingSubjectRecord,
  SHIBU_DARK_COLOR,
} from "./shared";

interface CurrentScoresSectionProps {
  studentId: string;
}

// 分数颜色：≥85% 绿色，60-85% 黄色，<60% 红色
function getScoreColor(score: number, fullScore: number): string {
  if (fullScore <= 0) return "text-gray-600";
  const ratio = score / fullScore;
  if (ratio >= 0.85) return "text-green-600";
  if (ratio >= 0.6) return "text-yellow-600";
  return "text-red-600";
}

// 按学科分组取最近一条（API 已按 examDate DESC 返回，故首条即最近）
function pickLatestPerSubject(records: ScoreRecord[]): ScoreRecord[] {
  const map = new Map<string, ScoreRecord>();
  records.forEach((r) => {
    if (!map.has(r.subjectId)) map.set(r.subjectId, r);
  });
  return Array.from(map.values()).sort((a, b) =>
    (a.subjectName ?? a.subjectId).localeCompare(
      b.subjectName ?? b.subjectId,
      "zh-CN"
    )
  );
}

// 格式化日期为本地短日期
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-CN");
}

// 当前成绩表格渲染
function CurrentScoresTable({
  list,
  trainingSubjectIds,
}: {
  list: ScoreRecord[];
  trainingSubjectIds: string[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left font-medium">学科</th>
            <th className="px-3 py-2 text-left font-medium">最近考试</th>
            <th className="px-3 py-2 text-left font-medium">分数</th>
            <th className="px-3 py-2 text-left font-medium">排名</th>
            <th className="px-3 py-2 text-left font-medium">日期</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => {
            const isTraining = trainingSubjectIds.includes(r.subjectId);
            return (
              <tr key={r.id} className={isTraining ? "bg-shibu-50" : ""}>
                <td
                  className="px-3 py-2 font-medium text-gray-900"
                  style={
                    isTraining
                      ? { boxShadow: `inset 4px 0 0 0 ${SHIBU_DARK_COLOR}` }
                      : undefined
                  }
                >
                  {r.subjectName ?? r.subjectId}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {r.examName}
                  <span className="ml-1 text-xs text-gray-400">
                    {r.examType}
                  </span>
                </td>
                <td
                  className={`px-3 py-2 font-semibold ${getScoreColor(
                    r.score,
                    r.fullScore
                  )}`}
                >
                  {r.score}
                  <span className="text-xs text-gray-400">/{r.fullScore}</span>
                </td>
                <td className="px-3 py-2 text-gray-600">{r.rank ?? "—"}</td>
                <td className="px-3 py-2 text-gray-500">
                  {formatDate(r.examDate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// 学生详情页基本信息区：按科目展示最近一次成绩与排名
export default function CurrentScoresSection({
  studentId,
}: CurrentScoresSectionProps) {
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [trainingSubjectIds, setTrainingSubjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const [scoreRes, tsRes] = await Promise.all([
        fetch(`/api/students/${sid}/scores`),
        fetch(`/api/students/${sid}/training-subjects`),
      ]);
      const scoreData = await scoreRes.json();
      const tsData = await tsRes.json();
      setRecords(scoreData.data ?? []);
      const tsList: TrainingSubjectRecord[] = tsData.data ?? [];
      setTrainingSubjectIds(tsList.map((t) => t.subjectId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载成绩数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (studentId) void loadAll(studentId);
  }, [studentId, loadAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center text-gray-400 py-6">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        加载当前成绩...
      </div>
    );
  }

  const latestList = pickLatestPerSubject(records);
  if (latestList.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">
        暂无成绩数据，请到成绩记录录入
      </p>
    );
  }

  return (
    <CurrentScoresTable
      list={latestList}
      trainingSubjectIds={trainingSubjectIds}
    />
  );
}
