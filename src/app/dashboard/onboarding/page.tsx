"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Rocket, CheckCircle, Circle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface Step {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

export default function OnboardingPage() {
  const { status } = useSession();
  const [steps, setSteps] = useState<Step[]>([]);
  const [progress, setProgress] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/onboarding");
      const data = await res.json();
      setSteps(data.data.steps);
      setProgress(data.data.progress);
      setAllDone(data.data.allDone);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-shibu-500 to-shibu-700 flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {allDone ? "恭喜！你已经掌握了所有功能 🎉" : "欢迎来到拾步工作室"}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          {allDone
            ? "你已经完成了所有引导步骤，现在可以自由使用系统了"
            : "完成以下步骤，快速上手工作室管理系统"}
        </p>
      </div>

      {/* 进度 */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">新手进度</span>
          <span className="text-sm text-shibu-600 font-medium">{progress}%</span>
        </div>
        <div className="bg-gray-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-shibu-500 to-confidence-500 h-3 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          已完成 {steps.filter((s) => s.done).length}/{steps.length} 步
          {allDone ? " 🎉" : ""}
        </p>
      </div>

      {/* 步骤列表 */}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`bg-white rounded-xl p-5 border transition ${
              step.done ? "border-green-200 bg-green-50/30" : "border-gray-100"
            }`}
          >
            <div className="flex items-center gap-4">
              {/* 状态图标 */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  step.done
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step.done ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-bold">{i + 1}</span>
                )}
              </div>

              {/* 内容 */}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    step.done ? "text-green-700" : "text-gray-900"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {step.done ? "已完成" : "待完成"}
                </p>
              </div>

              {/* 操作按钮 */}
              {!step.done ? (
                <Link
                  href={step.href}
                  className="flex items-center gap-1 px-4 py-2 bg-shibu-600 text-white rounded-lg text-xs hover:bg-shibu-700 transition"
                >
                  去完成 <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <Link
                  href={step.href}
                  className="flex items-center gap-1 px-4 py-2 text-green-600 rounded-lg text-xs hover:bg-green-50 transition"
                >
                  查看 <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 完成状态 */}
      {allDone && (
        <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 text-center">
          <Sparkles className="w-8 h-8 text-confidence-500 mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            你已经完成了所有引导步骤
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            现在可以探索更多功能：双轨制计划、AI学案、学员周报、业财看板...
          </p>
          <Link
            href="/dashboard/notifications"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700"
          >
            查看通知中心 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
