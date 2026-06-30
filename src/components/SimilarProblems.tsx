"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Lightbulb, CheckCircle, XCircle, RefreshCw, Brain } from "lucide-react";

interface SimilarProblem {
  id: string;
  content: string;
  hint: string;
  difficulty: string;
}

interface Props {
  mistakeId: string;
  mistakeStatus: string;
  onStatusChange: () => void;
}

export default function SimilarProblems({
  mistakeId,
  mistakeStatus,
  onStatusChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<SimilarProblem[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());

  const fetchSimilar = async () => {
    if (open && problems.length > 0) {
      setOpen(false);
      return;
    }

    if (problems.length > 0) {
      setOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/mistakes/${mistakeId}/similar`);
      const data = await res.json();
      setProblems(data.data?.problems || []);
      setOpen(true);
    } catch (err) {
      toast.error("获取同类题失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (problemId: string, correct: boolean) => {
    try {
      const res = await fetch(`/api/mistakes/${mistakeId}/similar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correct }),
      });
      const data = await res.json();

      if (correct) {
        setSolvedIds((prev) => new Set(prev).add(problemId));
      }

      toast.success(data.message || (correct ? "做对了！" : "继续加油！"));
      if (data.data?.status !== mistakeStatus) {
        onStatusChange();
      }
    } catch (err) {
      toast.error("提交失败");
    }
  };

  if (mistakeStatus === "mastered") return null;

  return (
    <div className="mt-3">
      {/* 展开/收起按钮 */}
      <button
        onClick={fetchSimilar}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-shibu-600 hover:text-shibu-700 font-medium"
      >
        {loading ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Brain className="w-3.5 h-3.5" />
        )}
        {loading
          ? "生成同类题中..."
          : open
          ? "收起同类题"
          : "🎯 举一反三 · 同类题训练"}
      </button>

      {/* 同类题列表 */}
      {open && problems.length > 0 && (
        <div className="mt-3 space-y-3 border border-shibu-100 rounded-lg p-4 bg-shibu-50/30">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-confidence-500" />
            <span className="text-xs font-medium text-gray-600">
              {problems.length === 3
                ? "连续做对3道同类题，自动标记为「已掌握」"
                : "完成同类题训练巩固"}
            </span>
          </div>

          {problems.map((problem, i) => {
            const solved = solvedIds.has(problem.id);
            return (
              <div
                key={problem.id}
                className={`rounded-lg p-3 border ${
                  solved
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-shibu-500 mt-0.5 shrink-0">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{problem.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          problem.difficulty === "基础"
                            ? "bg-green-100 text-green-600"
                            : problem.difficulty === "中等"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                      {!solved && (
                        <span className="text-[10px] text-gray-400">
                          💡 {problem.hint}
                        </span>
                      )}
                      {solved && (
                        <span className="text-[10px] text-green-500">
                          ✅ 已掌握
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                {!solved && (
                  <div className="flex gap-2 mt-2 ml-5">
                    <button
                      onClick={() => handleAnswer(problem.id, true)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
                    >
                      <CheckCircle className="w-3 h-3" />
                      做对了
                    </button>
                    <button
                      onClick={() => handleAnswer(problem.id, false)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-orange-50 text-orange-600 rounded hover:bg-orange-100"
                    >
                      <XCircle className="w-3 h-3" />
                      没做对
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {problems.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              暂无同类题推荐
            </p>
          )}
        </div>
      )}
    </div>
  );
}
