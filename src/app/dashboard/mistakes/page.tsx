"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Filter, Search, Camera, Sparkles, Loader2 } from "lucide-react";
import {
  formatDate,
  getErrorTypeLabel,
  getErrorTypeColor,
} from "@/lib/utils";
import SimilarProblems from "@/components/SimilarProblems";
import CameraCapture from "@/components/CameraCapture";

interface Mistake {
  id: string;
  studentId: string;
  subject: string;
  errorType: string;
  originalContent: string | null;
  correctAnswer: string | null;
  wrongAnswer: string | null;
  imageUrl: string | null;
  status: string;
  correctCount: number;
  createdAt: string;
  student: { id: string; name: string; grade: { name: string } | null };
  knowledgePoint: { id: string; name: string } | null;
}

interface Student {
  id: string;
  name: string;
  gradeName: string;
}

export default function MistakesPage() {
  const { status } = useSession();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterErrorType, setFilterErrorType] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({
    studentId: "",
    subject: "",
    errorType: "unknown",
    originalContent: "",
    correctAnswer: "",
    wrongAnswer: "",
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>("");
  const [searchUrl, setSearchUrl] = useState<string>("");

  const fetchMistakes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStudent) params.set("studentId", filterStudent);
      if (filterErrorType) params.set("errorType", filterErrorType);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/mistakes?${params}`);
      const data = await res.json();
      setMistakes(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterStudent, filterErrorType, filterStatus]);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") {
      fetchMistakes();
      fetchStudents();
    }
  }, [status, filterErrorType, filterStudent, filterStatus, fetchMistakes]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students?status=active");
      const data = await res.json();
      setStudents(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  /** 拍照后处理：OCR 识别 + AI 分析 */
  const handlePhotoCapture = useCallback(async (base64: string) => {
    setCapturedImage(base64);
    setOcrProcessing(true);
    setOcrStatus("正在识别图片文字...");
    setSearchUrl("");

    try {
      // 1. OCR 识别
      const ocrRes = await fetch("/api/mistakes/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const ocrData = await ocrRes.json();
      if (!ocrRes.ok) throw new Error(ocrData.message || ocrData.error);

      setOcrStatus("正在分析题目...");
      const rawText = ocrData.data?.rawText || "";

      // 2. AI 分析题目
      const analyzeRes = await fetch("/api/mistakes/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, subject: form.subject }),
      });
      const analyzeData = await analyzeRes.json();

      if (analyzeRes.ok && analyzeData.data) {
        const { question, studentAnswer, correctAnswer, searchQuery } = analyzeData.data;

        // 3. 自动填入表单
        setForm((prev) => ({
          ...prev,
          originalContent: question || rawText.slice(0, 500),
          wrongAnswer: studentAnswer || prev.wrongAnswer,
          correctAnswer: correctAnswer || prev.correctAnswer,
        }));

        // 4. 生成搜索链接（打开新标签页搜索解法）
        if (searchQuery) {
          const encoded = encodeURIComponent(searchQuery);
          setSearchUrl(`https://www.baidu.com/s?wd=${encoded}+答案+解析`);
        }

        setOcrStatus(question ? "识别完成，已自动填入表单" : "识别完成");
        toast.success("题目识别完成");
      } else {
        // 分析失败，至少填入识别文本
        setForm((prev) => ({
          ...prev,
          originalContent: rawText.slice(0, 500),
        }));
        setOcrStatus("文字已识别，可手动填写答案");
        toast.success("文字识别完成");
      }
    } catch (err: any) {
      console.error("OCR 处理失败:", err);
      toast.error(err.message || "识别失败，请手动录入");
      setOcrStatus("识别失败");
    } finally {
      setOcrProcessing(false);
    }
  }, [form.subject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.subject || !form.originalContent) {
      toast.error("请填写完整信息");
      return;
    }

    try {
      const res = await fetch("/api/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      toast.success("错题已记录");
      setShowNewForm(false);
      setForm({
        studentId: "",
        subject: "",
        errorType: "unknown",
        originalContent: "",
        correctAnswer: "",
        wrongAnswer: "",
      });
      setCapturedImage(null);
      setOcrStatus("");
      setSearchUrl("");
      fetchMistakes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: string
  ) => {
    try {
      await fetch(`/api/mistakes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast.success("状态已更新");
      fetchMistakes();
    } catch (err) {
      toast.error("更新失败");
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">错题管理</h1>
          <p className="text-sm text-gray-500 mt-1">记录错题、归类错因、追踪掌握</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export?type=mistakes"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            📥 导出CSV
          </a>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-shibu-600 text-white rounded-lg hover:bg-shibu-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> 录入错题
          </button>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-3 mb-6">
        <select
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">全部学生</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterErrorType}
          onChange={(e) => setFilterErrorType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">全部错因</option>
          <option value="careless">粗心大意</option>
          <option value="concept">概念不清</option>
          <option value="approach">思路不对</option>
          <option value="unknown">完全不会</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">全部状态</option>
          <option value="unsolved">待解决</option>
          <option value="in_progress">巩固中</option>
          <option value="mastered">已掌握</option>
        </select>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : mistakes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📸</div>
          <p>还没有错题记录</p>
          <p className="text-sm mt-1">点击「录入错题」开始收集</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mistakes.map((mistake) => (
            <div
              key={mistake.id}
              className="bg-white rounded-xl p-5 border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 标签行 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {mistake.student.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {mistake.student.grade?.name}
                    </span>
                    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded">
                      {mistake.subject}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getErrorTypeColor(mistake.errorType)}`}
                    >
                      {getErrorTypeLabel(mistake.errorType)}
                    </span>
                    {mistake.knowledgePoint && (
                      <span className="text-xs text-gray-400">
                        {mistake.knowledgePoint.name}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        mistake.status === "mastered"
                          ? "bg-green-100 text-green-700"
                          : mistake.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {mistake.status === "mastered"
                        ? "✅ 已掌握"
                        : mistake.status === "in_progress"
                        ? "🔄 巩固中"
                        : "📌 待解决"}
                    </span>
                  </div>

                  {/* 错题图片 */}
                  {mistake.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={mistake.imageUrl}
                        alt="错题图片"
                        className="max-h-40 rounded-lg border border-gray-200 object-contain bg-white"
                      />
                    </div>
                  )}

                  {/* 错题内容 */}
                  <div className="bg-gray-50 rounded-lg p-3 mt-2">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {mistake.originalContent}
                    </p>
                    {mistake.wrongAnswer && (
                      <div className="mt-2 text-sm">
                        <span className="text-red-500">错误答案：</span>
                        <span className="text-gray-500">
                          {mistake.wrongAnswer}
                        </span>
                      </div>
                    )}
                    {mistake.correctAnswer && (
                      <div className="mt-1 text-sm">
                        <span className="text-green-500">正确答案：</span>
                        <span className="text-gray-700">
                          {mistake.correctAnswer}
                        </span>
                      </div>
                    )}
                    {/* 搜索解法按钮 */}
                    {mistake.originalContent && (
                      <div className="mt-2 flex gap-2">
                        <a
                          href={`https://www.baidu.com/s?wd=${encodeURIComponent(mistake.originalContent.slice(0, 80))}+答案+解析`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-shibu-600 hover:text-shibu-700"
                        >
                          <Search className="w-3 h-3" />
                          搜索答案与解析
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作 */}
                <div className="ml-4 flex flex-col gap-2">
                  <span className="text-xs text-gray-400">
                    {formatDate(mistake.createdAt)}
                  </span>
                  {mistake.status !== "mastered" && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          mistake.id,
                          mistake.status === "unsolved"
                            ? "in_progress"
                            : "mastered"
                        )
                      }
                      className="text-xs px-3 py-1.5 bg-shibu-50 text-shibu-600 rounded-lg hover:bg-shibu-100"
                    >
                      {mistake.status === "unsolved"
                        ? "标记巩固中"
                        : "标记已掌握"}
                    </button>
                  )}
                  {mistake.correctCount > 0 && (
                    <span className="text-xs text-gray-400">
                      同类做对 {mistake.correctCount} 次
                    </span>
                  )}
                </div>
              </div>
              {/* 举一反三 — 同类题训练 */}
              <SimilarProblems
                mistakeId={mistake.id}
                mistakeStatus={mistake.status}
                onStatusChange={fetchMistakes}
              />
            </div>
          ))}
        </div>
      )}

      {/* 新建错题弹窗 */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              录入错题
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                        {s.name}（{s.gradeName}）
                      </option>
                    ))}
                  </select>
                </div>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  错因分类
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "careless", label: "粗心大意" },
                    { value: "concept", label: "概念不清" },
                    { value: "approach", label: "思路不对" },
                    { value: "unknown", label: "完全不会" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, errorType: option.value })
                      }
                      className={`px-3 py-2 rounded-lg text-sm border transition ${
                        form.errorType === option.value
                          ? "bg-shibu-50 border-shibu-300 text-shibu-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  错题内容
                </label>
                <textarea
                  value={form.originalContent}
                  onChange={(e) =>
                    setForm({ ...form, originalContent: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  rows={3}
                  placeholder="录入错题的题干或描述，或使用下方拍照功能自动识别"
                  required
                />
              </div>

              {/* 拍照 + OCR 区域 */}
              <div className="border border-dashed border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Camera className="w-4 h-4" />
                  <span>拍照识别（支持手写/印刷体）</span>
                </div>
                <CameraCapture
                  onCapture={handlePhotoCapture}
                  existingImage={capturedImage}
                  onClear={() => {
                    setCapturedImage(null);
                    setOcrStatus("");
                    setSearchUrl("");
                  }}
                />
                {/* OCR 处理状态 */}
                {ocrProcessing && (
                  <div className="flex items-center gap-2 text-sm text-shibu-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{ocrStatus}</span>
                  </div>
                )}
                {!ocrProcessing && ocrStatus && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Sparkles className="w-4 h-4" />
                    <span>{ocrStatus}</span>
                  </div>
                )}
                {/* 搜索解法按钮 */}
                {searchUrl && (
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-shibu-600 hover:text-shibu-700"
                  >
                    <Search className="w-3 h-3" />
                    搜索该题答案与解析
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学生的错误答案
                  </label>
                  <textarea
                    value={form.wrongAnswer}
                    onChange={(e) =>
                      setForm({ ...form, wrongAnswer: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    rows={2}
                    placeholder="学生做错了什么？"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    正确答案
                  </label>
                  <textarea
                    value={form.correctAnswer}
                    onChange={(e) =>
                      setForm({ ...form, correctAnswer: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    rows={2}
                    placeholder="正确答案是什么？"
                  />
                </div>
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
                  保存错题
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
