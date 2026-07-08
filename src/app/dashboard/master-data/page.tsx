"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Building2, GraduationCap, BookOpen, Library, GitBranch } from "lucide-react";
import SchoolsTab from "./tabs/SchoolsTab";
import GradesTab from "./tabs/GradesTab";
import SubjectsTab from "./tabs/SubjectsTab";
import TextbooksTab from "./tabs/TextbooksTab";
import ChaptersTab from "./tabs/ChaptersTab";

type TabKey = "schools" | "grades" | "subjects" | "textbooks" | "chapters";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "schools", label: "学校", icon: Building2 },
  { key: "grades", label: "年级", icon: GraduationCap },
  { key: "subjects", label: "学科", icon: BookOpen },
  { key: "textbooks", label: "教材版本", icon: Library },
  { key: "chapters", label: "教材章节", icon: GitBranch },
];

export default function MasterDataPage() {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("schools");

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" />
      </div>
    );
  }
  if (status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">主数据管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          管理学校、年级、学科、教材版本与教材章节主数据
        </p>
      </div>

      {/* Tab 导航 */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                isActive
                  ? "border-shibu-600 text-shibu-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 内容 */}
      <div>
        {activeTab === "schools" && <SchoolsTab />}
        {activeTab === "grades" && <GradesTab />}
        {activeTab === "subjects" && <SubjectsTab />}
        {activeTab === "textbooks" && <TextbooksTab />}
        {activeTab === "chapters" && <ChaptersTab />}
      </div>
    </div>
  );
}
