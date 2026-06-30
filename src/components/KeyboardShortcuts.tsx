"use client";

import { useState, useEffect } from "react";
import { Command, Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { keys: ["⌘K", "Ctrl+K"], desc: "导航搜索", category: "通用" },
  { keys: ["⌘⇧F", "Ctrl+Shift+F"], desc: "全局数据搜索", category: "通用" },
  { keys: ["ESC"], desc: "关闭弹窗/搜索面板", category: "通用" },
  { keys: ["/dashboard/students/new"], desc: "新建学生", category: "页面" },
  { keys: ["/dashboard/courses"], desc: "排课日历", category: "页面" },
  { keys: ["/dashboard/records"], desc: "每日学情", category: "页面" },
  { keys: ["/dashboard/mistakes"], desc: "错题管理", category: "页面" },
  { keys: ["/dashboard/review"], desc: "错题复习", category: "页面" },
  { keys: ["/dashboard/scores"], desc: "成绩曲线", category: "页面" },
  { keys: ["/dashboard/weekly"], desc: "学员周报", category: "页面" },
  { keys: ["/dashboard/finance"], desc: "业财看板", category: "页面" },
  { keys: ["/dashboard/revenue"], desc: "月度收入", category: "页面" },
  { keys: ["Ctrl+P"], desc: "打印当前页面", category: "操作" },
  { keys: ["Ctrl+S"], desc: "保存表单", category: "操作" },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ? 键打开帮助
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !(e.target as HTMLElement)?.closest?.("input,textarea,select")) {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const categories = Array.from(new Set(SHORTCUTS.map((s) => s.category)));

  return (
    <>
      {/* 触发按钮 — 问号帮助 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 w-10 h-10 rounded-full bg-shibu-600 text-white flex items-center justify-center shadow-lg hover:bg-shibu-700 transition z-40 no-print"
        title="快捷键帮助"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <Command className="w-5 h-5 text-shibu-600" />
                <h2 className="text-lg font-semibold text-gray-900">键盘快捷键</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 快捷键列表 */}
            <div className="p-6 space-y-6">
              {categories.map((cat) => (
                <div key={cat}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {cat}
                  </h3>
                  <div className="space-y-2">
                    {SHORTCUTS.filter((s) => s.category === cat).map((shortcut, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{shortcut.desc}</span>
                        <div className="flex gap-1">
                          {shortcut.keys.map((key, j) => (
                            <kbd
                              key={j}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono border border-gray-200"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-shibu-50 rounded-lg p-3 text-xs text-shibu-600">
                💡 按 <kbd className="px-1 bg-shibu-100 rounded font-mono">?</kbd> 键随时打开此面板
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
