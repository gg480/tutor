"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { ArrowLeft, Printer } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StudentInfo {
  id: string;
  name: string;
  grade: string;
  school: string | null;
  parentName: string | null;
  parentGoal: string | null;
  studentGoal: string | null;
  textbook: string | null;
  currentScore: string | null;
  personality: string | null;
  weakness: string | null;
  summary: string | null;
  diagnosticReports: any[];
}

export default function DiagnosticReportPage() {
  const params = useParams();
  const studentId = params?.id as string | undefined;
  const router = useRouter();
  const { status: authStatus } = useSession();

  if (!studentId) {
    return <div className="text-center py-20 text-gray-400">参数错误</div>;
  }
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportContent, setReportContent] = useState({
    conclusion: "",
    recommendations: "",
    teacherNotes: "",
  });

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated" && studentId) fetchStudent();
  }, [authStatus, studentId]);

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${studentId}`);
      const data = await res.json();
      setStudent(data.data);
    } catch (err) {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportContent.conclusion) {
      toast.error("请填写诊断结论");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/diagnostic-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId,
          subjectiveInfo: student?.parentGoal
            ? `家长期望：${student.parentGoal}\n学生目标：${student.studentGoal || "未提供"}`
            : null,
          objectiveInfo: student?.currentScore
            ? `当前成绩：${student.currentScore}\n教材版本：${student.textbook || "未提供"}`
            : null,
          weaknessAnalysis: student?.weakness
            ? { diagnosis: student.weakness, personality: student.personality }
            : null,
          teacherNotes: reportContent.teacherNotes,
          conclusion: reportContent.conclusion,
          recommendations: reportContent.recommendations,
        }),
      });

      if (!res.ok) throw new Error("生成失败");

      toast.success("诊断报告已生成！");
      fetchStudent();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" />
      </div>
    );
  }

  if (!student) {
    return <div className="text-center py-20 text-gray-400">学生不存在</div>;
  }

  const lastReport = student.diagnosticReports?.[0];

  return (
    <div>
      <button
        onClick={() => router.push(`/dashboard/students/${studentId}`)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        返回学生详情
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">学情诊断报告</h1>
            <p className="text-sm text-gray-500 mt-1">
              {student.name} · {student.grade}
              {student.school && ` · ${student.school}`}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            打印/导出PDF
          </button>
        </div>

        {/* 已有报告展示 */}
        {lastReport && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                最新诊断报告
              </h2>
              <span className="text-xs text-gray-400">
                生成于 {formatDate(lastReport.createdAt)}
              </span>
            </div>

            {lastReport.subjectiveInfo && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-shibu-600 mb-2">
                  一、主观认知
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {lastReport.subjectiveInfo}
                </p>
              </div>
            )}

            {lastReport.objectiveInfo && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-shibu-600 mb-2">
                  二、客观信息
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {lastReport.objectiveInfo}
                </p>
              </div>
            )}

            {lastReport.weaknessAnalysis && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-shibu-600 mb-2">
                  三、薄弱点诊断
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {lastReport.weaknessAnalysis}
                </p>
              </div>
            )}

            {lastReport.teacherNotes && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-shibu-600 mb-2">
                  四、教师综合观察
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {lastReport.teacherNotes}
                </p>
              </div>
            )}

            {lastReport.conclusion && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-shibu-600 mb-2">
                  五、诊断结论
                </h3>
                <div className="bg-shibu-50 rounded-lg p-4">
                  <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap">
                    {lastReport.conclusion}
                  </p>
                </div>
              </div>
            )}

            {lastReport.recommendations && (
              <div>
                <h3 className="text-sm font-semibold text-shibu-600 mb-2">
                  六、改进建议
                </h3>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {lastReport.recommendations}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 生成新报告 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {lastReport ? "更新诊断报告" : "生成诊断报告"}
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            基于采集到的信息，完成最终的诊断结论和建议
          </p>

          <div className="space-y-4">
            {/* 诊断结论 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                诊断结论 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reportContent.conclusion}
                onChange={(e) =>
                  setReportContent({
                    ...reportContent,
                    conclusion: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
                rows={4}
                placeholder="综合判断学生的核心问题是什么？学习习惯、知识短板、思维方式...

例如：
- 核心问题：函数思维尚未建立，对变量间的关系理解停留在机械记忆层面
- 具体表现：能完成单一公式计算，但遇到多步推理的应用题时思路混乱
- 根因分析：小学阶段缺乏数学建模训练，初中知识跨度大未能及时适应"
              />
            </div>

            {/* 改进建议 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                改进建议
              </label>
              <textarea
                value={reportContent.recommendations}
                onChange={(e) =>
                  setReportContent({
                    ...reportContent,
                    recommendations: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
                rows={4}
                placeholder="给出具体、可执行的改进路径...

例如：
短期（1-2周）：每天2道应用题列方程训练，重点突破等量关系识别
中期（1-2月）：建立错题本，每周复盘一次，针对性强化薄弱题型
长期：逐步建立函数思维，从一元一次方程过渡到二元一次方程组"
              />
            </div>

            {/* 教师备注 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                教师综合观察
              </label>
              <textarea
                value={reportContent.teacherNotes}
                onChange={(e) =>
                  setReportContent({
                    ...reportContent,
                    teacherNotes: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
                rows={3}
                placeholder="补充教师在诊断过程中的观察和感受..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() =>
                  router.push(`/dashboard/students/${studentId}`)
                }
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="px-6 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700 disabled:opacity-50"
              >
                {generating
                  ? "生成中..."
                  : lastReport
                  ? "更新报告"
                  : "生成报告"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
