"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import {
  RotateCcw, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  Brain, BarChart3, Trophy,
} from "lucide-react";
import { getErrorTypeLabel } from "@/lib/utils";

interface ReviewMistake {
  id: string;
  subject: string;
  errorType: string;
  originalContent: string | null;
  correctAnswer: string | null;
  wrongAnswer: string | null;
  status: string;
  correctCount: number;
  knowledgePoint: { name: string } | null;
  student: { id: string; name: string; grade: { name: string } | null };
}

export default function ReviewPage() {
  const { status } = useSession();
  const [mistakes, setMistakes] = useState<ReviewMistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [filterStudent, setFilterStudent] = useState("");
  const [filterErrorType, setFilterErrorType] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);

  const fetchMistakes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filterStudent) params.set("studentId", filterStudent);
      if (filterErrorType) params.set("errorType", filterErrorType);
      const res = await fetch(`/api/mistakes?${params}`);
      const data = await res.json();
      setMistakes((data.data || []).filter((m: any) => m.status !== "mastered"));
      setCurrentIndex(0);
      setShowAnswer(false);
      setResults({});
      setSessionComplete(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterStudent, filterErrorType]);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") {
      fetchMistakes();
      fetchStudents();
    }
  }, [status, filterStudent, filterErrorType, fetchMistakes]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      setStudents(data.data || []);
    } catch (err) { console.error(err); }
  };

  const currentMistake = mistakes[currentIndex];
  const totalMistakes = mistakes.length;
  const reviewedCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter(Boolean).length;

  const handleReveal = () => setShowAnswer(true);

  const handleResult = async (correct: boolean) => {
    if (!currentMistake) return;

    // 更新本地状态
    setResults({ ...results, [currentMistake.id]: correct });
    setShowAnswer(false);

    // 更新后端
    try {
      await fetch(`/api/mistakes/${currentMistake.id}/similar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correct }),
      });
    } catch (err) { /* ignore */ }

    // 下一题或完成
    if (currentIndex < totalMistakes - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const progressPct = totalMistakes > 0 ? Math.round((reviewedCount / totalMistakes) * 100) : 0;

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-shibu-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">错题复习</h1>
          <p className="text-sm text-gray-500 mt-1">逐题回顾，巩固薄弱知识点</p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-3 mb-6">
        <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">全部学生</option>
          {students.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterErrorType} onChange={(e) => setFilterErrorType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">全部错因</option>
          <option value="careless">粗心大意</option>
          <option value="concept">概念不清</option>
          <option value="approach">思路不对</option>
          <option value="unknown">完全不会</option>
        </select>
        <button onClick={fetchMistakes}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RotateCcw className="w-4 h-4 inline mr-1" />刷新
        </button>
        {totalMistakes > 0 && !sessionComplete && (
          <span className="text-sm text-gray-400 self-center ml-auto">
            已复习 {reviewedCount}/{totalMistakes}
          </span>
        )}
      </div>

      {/* 进度条 */}
      {totalMistakes > 0 && !sessionComplete && (
        <div className="bg-gray-100 rounded-full h-1.5 mb-6">
          <div className="bg-shibu-500 h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : totalMistakes === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">没有需要复习的错题 🎉</p>
          <p className="text-sm mt-1">所有错题已掌握或暂无错题记录</p>
        </div>
      ) : sessionComplete ? (
        /* 复习完成总结 */
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-confidence-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">复习完成！</h2>
            <p className="text-sm text-gray-500 mb-6">错题复习结果总结</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-600">{correctCount}</p>
                <p className="text-xs text-gray-500">已掌握</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-orange-600">{totalMistakes - correctCount}</p>
                <p className="text-xs text-gray-500">需巩固</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setSessionComplete(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                查看详情
              </button>
              <button onClick={fetchMistakes}
                className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700">
                <RotateCcw className="w-4 h-4 inline mr-1" />再次复习
              </button>
            </div>
          </div>

          {/* 复习详情 */}
          <div className="mt-6 space-y-2">
            {mistakes.map((m, i) => {
              const result = results[m.id];
              if (result === undefined) return null;
              return (
                <div key={m.id} className="bg-white rounded-lg p-3 border border-gray-100 text-sm flex items-center gap-3">
                  {result ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  <span className="text-gray-700 truncate flex-1 text-left">{m.originalContent?.slice(0, 40)}</span>
                  <span className="text-xs text-gray-400">{m.student.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : currentMistake ? (
        /* 复习卡片 */
        <div className="max-w-2xl mx-auto">
          <div className="text-xs text-gray-400 mb-3 text-center">
            第 {currentIndex + 1}/{totalMistakes} 题
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            {/* 题目标签 */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {currentMistake.subject}
              </span>
              <span className="text-xs bg-shibu-50 text-shibu-600 px-2 py-0.5 rounded">
                {getErrorTypeLabel(currentMistake.errorType)}
              </span>
              {currentMistake.knowledgePoint && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  {currentMistake.knowledgePoint.name}
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {currentMistake.student.name} · {currentMistake.student.grade?.name}
              </span>
            </div>

            {/* 题目 */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1 font-medium">题目</p>
              <p className="text-lg text-gray-900 leading-relaxed">
                {currentMistake.originalContent}
              </p>
            </div>

            {currentMistake.wrongAnswer && !showAnswer && (
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-red-500 mb-1">你的错误答案</p>
                <p className="text-sm text-red-700">{currentMistake.wrongAnswer}</p>
              </div>
            )}

            {/* 答案区域 */}
            {showAnswer ? (
              <div className="space-y-4">
                {currentMistake.correctAnswer && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-green-500 mb-1">正确答案</p>
                    <p className="text-sm text-green-700">{currentMistake.correctAnswer}</p>
                  </div>
                )}
                {currentMistake.correctCount > 0 && (
                  <p className="text-xs text-gray-400">同类题已做对 {currentMistake.correctCount} 次</p>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => handleResult(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 text-sm font-medium">
                    <CheckCircle className="w-5 h-5" /> 做对了
                  </button>
                  <button onClick={() => handleResult(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 text-sm font-medium">
                    <XCircle className="w-5 h-5" /> 还需要巩固
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleReveal}
                className="w-full py-4 bg-shibu-50 text-shibu-700 rounded-xl hover:bg-shibu-100 text-sm font-medium transition">
                <Brain className="w-5 h-5 inline mr-2" />
                查看答案
              </button>
            )}
          </div>

          {/* 导航 */}
          <div className="flex justify-between mt-4">
            <button onClick={() => { if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setShowAnswer(false); } }}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />上一题
            </button>
            <button onClick={() => { if (currentIndex < totalMistakes - 1) { setCurrentIndex(currentIndex + 1); setShowAnswer(false); } }}
              disabled={currentIndex === totalMistakes - 1}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30">
              下一题<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
