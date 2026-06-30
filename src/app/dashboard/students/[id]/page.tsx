"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Plus,
  Printer,
} from "lucide-react";
import { formatDate, getMasteryLabel, getErrorTypeLabel } from "@/lib/utils";
import StudentTimeline from "@/components/StudentTimeline";
import ConfirmDialog from "@/components/ConfirmDialog";
import { DetailSkeleton } from "@/components/Skeleton";

interface FullStudent {
  id: string;
  name: string;
  grade: string;
  school: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentWechat: string | null;
  parentGoal: string | null;
  studentGoal: string | null;
  textbook: string | null;
  currentScore: string | null;
  personality: string | null;
  weakness: string | null;
  summary: string | null;
  status: string;
  createdAt: string;
  diagnosticReports: any[];
  learningPlans: any[];
  courseRegistrations: any[];
  courses: any[];
  dailyRecords: any[];
  mistakeRecords: any[];
  examScores: any[];
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [student, setStudent] = useState<FullStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated" && id) fetchStudent();
  }, [authStatus, id]);

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${id}`);
      const data = await res.json();
      setStudent(data.data);
    } catch (err) {
      toast.error("加载学生信息失败");
    } finally {
      setLoading(false);
    }
  };

  const [shareUrl, setShareUrl] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleShare = async (studentId: string) => {
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (data.data?.shareUrl) {
        setShareUrl(data.data.shareUrl);
        setShowShareDialog(true);
      } else {
        throw new Error("生成失败");
      }
    } catch (err: any) {
      toast.error("生成分享链接失败");
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("链接已复制");
    } catch {
      // Fallback: select text
      const input = document.getElementById("share-url-input") as HTMLInputElement;
      if (input) { input.select(); document.execCommand("copy"); toast.success("链接已复制"); }
    }
  };

  if (loading || !student) {
    return <DetailSkeleton />;
  }

  const latestReg = student.courseRegistrations?.[0];
  const nextCourse = student.courses?.find((c) => c.status === "scheduled");
  const unsolvedMistakes = student.mistakeRecords?.filter(
    (m) => m.status !== "mastered"
  ).length;

  const tabs = [
    { id: "overview", label: "学情总览" },
    { id: "records", label: "学情记录" },
    { id: "mistakes", label: "错题本" },
    { id: "scores", label: "成绩曲线" },
    { id: "timeline", label: "成长时间线" },
  ];

  return (
    <div>
      {/* 返回按钮 */}
      <button
        onClick={() => router.push("/dashboard/students")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        返回学生列表
      </button>

      {/* 学生头部信息 */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-shibu-100 text-shibu-600 flex items-center justify-center text-2xl font-bold">
              {student.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {student.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span>{student.grade}</span>
                {student.school && <span>· {student.school}</span>}
                {student.textbook && <span>· {student.textbook}</span>}
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    student.status === "active"
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {student.status === "active" ? "在读" : "已结课"}
                </span>
              </div>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/dashboard/students/${student.id}/edit`)}
              className="text-sm px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
            >
              ✏️ 编辑
            </button>
            <button
              onClick={() => router.push(`/dashboard/students/${student.id}/learning-plan`)}
              className="text-sm px-3 py-2 bg-confidence-50 text-confidence-700 rounded-lg hover:bg-confidence-100"
            >
              🎯 双轨制计划
            </button>
            <button
              onClick={() => router.push(`/dashboard/students/${student.id}/diagnostic`)}
              className="text-sm px-3 py-2 bg-shibu-50 text-shibu-700 rounded-lg hover:bg-shibu-100"
            >
              📋 诊断报告
            </button>
            <button
              onClick={() => handleShare(student.id)}
              className="text-sm px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
            >
              🔗 分享
            </button>
            <button
              onClick={() => router.push("/dashboard/records")}
              className="text-sm px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
            >
              📝 记学情
            </button>
            <button
              onClick={() => router.push("/dashboard/mistakes")}
              className="text-sm px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100"
            >
              📸 录错题
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
            >
              🗑️ 删除
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-shibu-50 rounded-lg p-4">
            <p className="text-xs text-shibu-500">建档时间</p>
            <p className="text-sm font-semibold text-shibu-700 mt-1">
              {formatDate(student.createdAt)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-green-500">剩余课时</p>
            <p className="text-sm font-semibold text-green-700 mt-1">
              {latestReg ? `${latestReg.remainingHours}/${latestReg.totalHours}` : "无"}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-500">待处理错题</p>
            <p className="text-sm font-semibold text-blue-700 mt-1">
              {unsolvedMistakes || 0} 题
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-xs text-purple-500">学情记录</p>
            <p className="text-sm font-semibold text-purple-700 mt-1">
              {student.dailyRecords?.length || 0} 条
            </p>
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 bg-white rounded-t-xl border border-gray-100 border-b-0 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm rounded-lg transition ${
              activeTab === tab.id
                ? "bg-shibu-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="bg-white rounded-b-xl border border-gray-100 p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 主观认知 */}
            {(student.parentGoal || student.studentGoal) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  目标与期望
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {student.parentGoal && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-blue-500 mb-1">家长期望</p>
                      <p className="text-sm text-gray-700">
                        {student.parentGoal}
                      </p>
                    </div>
                  )}
                  {student.studentGoal && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-xs text-green-500 mb-1">学生目标</p>
                      <p className="text-sm text-gray-700">
                        {student.studentGoal}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 双轨制学习计划 */}
            {student.learningPlans?.[0] && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    双轨制学习计划
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      student.learningPlans[0].status === "active"
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {student.learningPlans[0].status === "active"
                      ? "进行中"
                      : "已完成"}
                  </span>
                </div>
                <div className="bg-gradient-to-r from-shibu-50 to-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-shibu-600">
                        {student.learningPlans[0].schoolRatio}%
                      </div>
                      <div className="text-xs text-gray-500">校内同步</div>
                    </div>
                    <div className="text-gray-300 text-xl font-light">+</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-confidence-500">
                        {student.learningPlans[0].examRatio}%
                      </div>
                      <div className="text-xs text-gray-500">竞赛拓展</div>
                    </div>
                    <div className="flex-1" />
                    {student.learningPlans[0].totalHours && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {student.learningPlans[0].totalHours} 课时
                        </div>
                        <div className="text-xs text-gray-400">
                          {student.learningPlans[0].price
                            ? `¥${student.learningPlans[0].price}`
                            : ""}
                        </div>
                      </div>
                    )}
                  </div>
                  {student.learningPlans[0].notes && (
                    <p className="text-xs text-gray-600">
                      {student.learningPlans[0].notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 教师诊断 */}
            {(student.personality ||
              student.weakness ||
              student.summary) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  教师诊断
                </h3>
                {student.personality && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">性格特点</p>
                    <p className="text-sm text-gray-700">
                      {student.personality}
                    </p>
                  </div>
                )}
                {student.weakness && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">薄弱点</p>
                    <p className="text-sm text-gray-700">{student.weakness}</p>
                  </div>
                )}
                {student.summary && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">概况</p>
                    <p className="text-sm text-gray-700">{student.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* 最近学情 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                最近学情
              </h3>
              {student.dailyRecords?.length > 0 ? (
                <div className="space-y-2">
                  {student.dailyRecords.slice(0, 5).map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-gray-500">
                        {formatDate(r.date)}
                      </span>
                      <span className="text-gray-700">
                        {getMasteryLabel(r.masteryLevel)}
                      </span>
                      <span className="text-gray-400 truncate max-w-xs">
                        {r.teacherNotes?.slice(0, 50)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">暂无学情记录</p>
              )}
            </div>

            {/* 错题统计 */}
            {student.mistakeRecords?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  错题分布
                </h3>
                <div className="flex gap-2">
                  {["careless", "concept", "approach", "unknown"].map(
                    (type) => {
                      const count = student.mistakeRecords.filter(
                        (m: any) => m.errorType === type
                      ).length;
                      if (count === 0) return null;
                      return (
                        <span
                          key={type}
                          className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600"
                        >
                          {getErrorTypeLabel(type)}: {count}题
                        </span>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "records" && (
          <div>
            {student.dailyRecords?.length > 0 ? (
              <div className="space-y-3">
                {student.dailyRecords.map((r: any) => (
                  <div
                    key={r.id}
                    className="border border-gray-100 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">
                        {formatDate(r.date)}
                      </span>
                      <span className="text-shibu-600 font-medium">
                        {getMasteryLabel(r.masteryLevel)}
                      </span>
                    </div>
                    {r.teacherNotes && (
                      <p className="text-sm text-gray-700 mb-2">
                        {r.teacherNotes}
                      </p>
                    )}
                    {r.nextFocus && (
                      <p className="text-xs text-gray-400">
                        下节课重点：{r.nextFocus}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-10">暂无学情记录</p>
            )}
          </div>
        )}

        {activeTab === "mistakes" && (
          <div>
            <div className="flex justify-end mb-3 no-print">
              <a
                href={`/dashboard/students/${student.id}/mistakes-print`}
                className="flex items-center gap-1 text-xs text-shibu-600 hover:text-shibu-700"
                target="_blank"
              >
                <Printer className="w-3 h-3" />
                打印错题本
              </a>
            </div>
            {student.mistakeRecords?.length > 0 ? (
              <div className="space-y-3">
                {student.mistakeRecords.map((m: any) => (
                  <div
                    key={m.id}
                    className="border border-gray-100 rounded-lg p-4 flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            m.errorType === "careless"
                              ? "bg-yellow-100 text-yellow-700"
                              : m.errorType === "concept"
                              ? "bg-red-100 text-red-700"
                              : m.errorType === "approach"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {getErrorTypeLabel(m.errorType)}
                        </span>
                        {m.knowledgePoint && (
                          <span className="text-xs text-gray-400">
                            {m.knowledgePoint.name}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            m.status === "mastered"
                              ? "bg-green-100 text-green-700"
                              : m.status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {m.status === "mastered"
                            ? "已掌握"
                            : m.status === "in_progress"
                            ? "巩固中"
                            : "待解决"}
                        </span>
                      </div>
                      {m.originalContent && (
                        <p className="text-sm text-gray-700 mt-1">
                          {m.originalContent}
                        </p>
                      )}
                    </div>
                    {m.correctCount > 0 && (
                      <span className="text-xs text-gray-400">
                        做对{m.correctCount}次
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-10">暂无错题记录</p>
            )}
          </div>
        )}

        {activeTab === "scores" && (
          <div>
            {student.examScores?.length > 0 ? (
              <div className="space-y-3">
                {student.examScores.map((s: any) => (
                  <div
                    key={s.id}
                    className="border border-gray-100 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">
                          {s.examName}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatDate(s.examDate)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-lg font-bold ${
                            s.score / s.totalScore >= 0.85
                              ? "text-green-600"
                              : s.score / s.totalScore >= 0.6
                              ? "text-shibu-600"
                              : "text-red-600"
                          }`}
                        >
                          {s.score}
                        </span>
                        <span className="text-sm text-gray-400">
                          /{s.totalScore}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{s.subject}</span>
                      {s.ranking && <span>排名：{s.ranking}</span>}
                      {s.classAverage && (
                        <span>班级平均：{s.classAverage}</span>
                      )}
                    </div>
                    {s.teacherAnalysis && (
                      <p className="text-sm text-gray-600 mt-2">
                        {s.teacherAnalysis}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-10">暂无成绩记录</p>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div>
            <StudentTimeline studentId={student.id} />
          </div>
        )}

        {/* 分享链接对话框 */}
        {showShareDialog && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">分享学情给家长</h3>
              <p className="text-sm text-gray-500 mb-4">家长打开链接可查看学生的学习报告</p>
              <div className="flex gap-2">
                <input id="share-url-input" type="text" readOnly value={shareUrl}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600" />
                <button onClick={copyShareUrl}
                  className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700 shrink-0">
                  复制
                </button>
              </div>
              <div className="flex justify-end mt-3">
                <button onClick={() => setShowShareDialog(false)}
                  className="text-sm text-gray-500 hover:text-gray-700">关闭</button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={showDeleteConfirm}
          title="删除学生"
          message={`确定要删除 ${student?.name || ""} 的全部数据吗？此操作不可恢复。`}
          confirmText="确认删除"
          variant="danger"
          onConfirm={async () => {
            try {
              await fetch(`/api/students/${id}`, { method: "DELETE" });
              toast.success("学生已删除");
              router.push("/dashboard/students");
            } catch (err) {
              toast.error("删除失败");
            } finally {
              setShowDeleteConfirm(false);
            }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}
