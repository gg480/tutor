"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Printer, ArrowLeft } from "lucide-react";
import { formatDate, getErrorTypeLabel } from "@/lib/utils";

interface Mistake {
  id: string;
  subject: string;
  errorType: string;
  originalContent: string | null;
  correctAnswer: string | null;
  wrongAnswer: string | null;
  status: string;
  correctCount: number;
  createdAt: string;
  knowledgePoint: { name: string } | null;
}

export default function MistakesPrintPage() {
  const params = useParams();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated" && params?.id) fetchData();
  }, [authStatus, params?.id]);

  useEffect(() => {
    if (!loading && mistakes.length > 0) {
      // 自动触发打印
      const timeout = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timeout);
    }
  }, [loading, mistakes]);

  const fetchData = async () => {
    if (!params || !params.id) return;
    try {
      const [studentRes, mistakesRes] = await Promise.all([
        fetch(`/api/students/${params.id}`),
        fetch(`/api/mistakes?studentId=${params.id}`),
      ]);
      const studentData = await studentRes.json();
      const mistakesData = await mistakesRes.json();
      setStudentName(studentData.data?.name || "");
      setMistakes(mistakesData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  // 按学科分组
  const grouped = mistakes.reduce<Record<string, Mistake[]>>((acc, m) => {
    const key = m.subject || "其他";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const totalMistakes = mistakes.length;
  const masteredCount = mistakes.filter((m) => m.status === "mastered").length;

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700"
        >
          <Printer className="w-4 h-4" />
          打印/导出PDF
        </button>
      </div>

      {/* 打印内容 */}
      <div className="print-area max-w-4xl mx-auto bg-white rounded-xl p-8 border border-gray-100">
        {/* 封面 */}
        <div className="text-center mb-8 pb-8 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">错题本</h1>
          <p className="text-lg text-shibu-600">{studentName}</p>
          <p className="text-sm text-gray-400 mt-1">
            共 {totalMistakes} 道错题 · 已掌握 {masteredCount} 道 · 打印于{" "}
            {new Date().toLocaleDateString("zh-CN")}
          </p>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">暂无错题记录</p>
          </div>
        ) : (
          Object.entries(grouped).map(([subject, subjectMistakes]) => (
            <div key={subject} className="mb-8 print-page-break">
              <h2 className="text-lg font-bold text-shibu-700 mb-4 pb-2 border-b border-shibu-200">
                {subject}
                <span className="text-sm font-normal text-gray-400 ml-2">
                  {subjectMistakes.length} 题
                </span>
              </h2>

              {subjectMistakes.map((m, i) => (
                <div
                  key={m.id}
                  className="mb-4 p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">#{i + 1}</span>
                    <span>{getErrorTypeLabel(m.errorType)}</span>
                    {m.knowledgePoint && (
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                        {m.knowledgePoint.name}
                      </span>
                    )}
                    <span
                      className={`ml-auto ${
                        m.status === "mastered"
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {m.status === "mastered" ? "✅ 已掌握" : "📌 待巩固"}
                    </span>
                  </div>

                  <div className="text-sm text-gray-800 mb-2">
                    {m.originalContent}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {m.wrongAnswer && (
                      <div className="bg-red-50 rounded p-2">
                        <span className="text-xs text-red-500 font-medium">
                          错误
                        </span>
                        <p className="text-gray-700 mt-0.5">{m.wrongAnswer}</p>
                      </div>
                    )}
                    {m.correctAnswer && (
                      <div className="bg-green-50 rounded p-2">
                        <span className="text-xs text-green-500 font-medium">
                          正确
                        </span>
                        <p className="text-gray-700 mt-0.5">{m.correctAnswer}</p>
                      </div>
                    )}
                  </div>

                  {m.correctCount > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      同类题做对 {m.correctCount} 次
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}

        {/* 统计页脚 */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>拾步 OPC Tutor Suite · 错题本</p>
          <p>生成于 {new Date().toLocaleString("zh-CN")}</p>
        </div>
      </div>
    </div>
  );
}
