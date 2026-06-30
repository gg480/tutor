"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, BookOpen, AlertTriangle, TrendingUp, CalendarCheck } from "lucide-react";

interface SearchResults {
  students: { id: string; name: string; grade: string; school: string | null; status: string }[];
  courses: { id: string; subject: string; startTime: string; status: string; student: { name: string } }[];
  records: { id: string; date: string; masteryLevel: number; teacherNotes: string | null; student: { name: string } }[];
  mistakes: { id: string; subject: string; errorType: string; originalContent: string | null; status: string; student: { name: string } }[];
  scores: { id: string; examName: string; subject: string; score: number; totalScore: number; student: { name: string } }[];
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  students: Users, courses: CalendarCheck, records: BookOpen, mistakes: AlertTriangle, scores: TrendingUp,
};

const SECTION_LABELS: Record<string, string> = {
  students: "学生", courses: "课程", records: "学情", mistakes: "错题", scores: "成绩",
};

const SECTION_COLORS: Record<string, string> = {
  students: "bg-blue-50 text-blue-600",
  courses: "bg-green-50 text-green-600",
  records: "bg-purple-50 text-purple-600",
  mistakes: "bg-orange-50 text-orange-600",
  scores: "bg-cyan-50 text-cyan-600",
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ⌘+Shift+F or Ctrl+Shift+F to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "F") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    else { setQuery(""); setResults(null); setCount(0); }
  }, [open]);

  // Debounce search
  useEffect(() => {
    if (!query || query.length < 1) { setResults(null); setCount(0); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.data);
        setCount(data.total);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback((href: string) => {
    router.push(href);
    setOpen(false);
  }, [router]);

  const totalResults = results
    ? Object.values(results).reduce((s: number, arr: any[]) => s + arr.length, 0)
    : 0;

  return (
    <>
      {/* 触发按钮（侧边栏底部） */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-xs text-gray-400 hover:bg-gray-50 transition"
      >
        <Search className="w-3.5 h-3.5" />
        <span>全局搜索</span>
        <kbd className="ml-auto text-[10px] text-gray-300 bg-white px-1.5 py-0.5 rounded border">⌘⇧F</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[70vh] flex flex-col">
            {/* 输入框 */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索学生、课程、学情、错题、成绩..."
                className="flex-1 text-sm outline-none placeholder-gray-300"
                autoFocus
              />
              {loading && <div className="w-4 h-4 border-2 border-shibu-500 border-t-transparent rounded-full animate-spin" />}
              {!loading && query && (
                <span className="text-xs text-gray-400">{count}条结果</span>
              )}
              <kbd className="text-[10px] text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded border shrink-0">ESC</kbd>
            </div>

            {/* 结果 */}
            <div className="flex-1 overflow-y-auto p-3">
              {!query ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  输入关键词搜索全平台数据
                </div>
              ) : totalResults === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  未找到与「{query}」相关的结果
                </div>
              ) : (
                Object.entries(results || {}).map(([key, items]) => {
                  if (!items || items.length === 0) return null;
                  const Icon = SECTION_ICONS[key] || Search;
                  const color = SECTION_COLORS[key] || "bg-gray-50 text-gray-600";
                  const label = SECTION_LABELS[key] || key;
                  return (
                    <div key={key} className="mb-3">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400">
                        <div className={`p-1 rounded ${color}`}><Icon className="w-3 h-3" /></div>
                        <span>{label}</span>
                        <span className="text-gray-300">({items.length})</span>
                      </div>
                      <div className="space-y-0.5">
                        {items.map((item: any) => (
                          <button
                            key={`${key}_${item.id}`}
                            onClick={() => {
                              const pathMap: Record<string, string> = {
                                students: `/dashboard/students/${item.id}`,
                                courses: `/dashboard/courses`,
                                records: `/dashboard/records`,
                                mistakes: `/dashboard/mistakes`,
                                scores: `/dashboard/scores`,
                              };
                              handleSelect(pathMap[key] || "/dashboard");
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left hover:bg-gray-50 transition"
                          >
                            <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-xs font-medium`}>
                              {item.name?.[0] || item.student?.name?.[0] || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-700 truncate font-medium">
                                {item.name || item.student?.name || item.examName || ""}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {item.grade || item.subject || item.examName || ""}
                                {item.school ? ` · ${item.school}` : ""}
                                {item.originalContent ? ` · ${item.originalContent.slice(0, 30)}` : ""}
                              </p>
                            </div>
                            <span className="text-xs text-gray-300 shrink-0">
                              {item.status === "active" ? "在读" :
                               item.status === "mastered" ? "已掌握" :
                               item.status === "completed" ? "已完成" : ""}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
