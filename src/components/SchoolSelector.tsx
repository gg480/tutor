"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { School, SCHOOL_LEVELS } from "@/app/dashboard/master-data/types";
import SchoolCreateModal from "./SchoolCreateModal";

const LEVEL_LABEL: Record<string, string> = Object.fromEntries(
  SCHOOL_LEVELS.map((l) => [l.value, l.label])
);

interface SchoolSelectorProps {
  value?: string;
  onChange: (schoolId: string, school: School | null) => void;
  placeholder?: string;
  // 回显时使用：父组件已知的学校名称（避免重新 fetch）
  initialSchoolName?: string;
}

// 拼接下拉项副标题：镇街 / 学段 / 重点等级
function buildSubtitle(s: School): string {
  const parts: string[] = [];
  if (s.town) parts.push(s.town);
  parts.push(LEVEL_LABEL[s.level] || s.level);
  if (s.isKey && s.keyLevel) parts.push(s.keyLevel);
  else if (s.isKey) parts.push("重点");
  return parts.join(" / ");
}

// 学校检索式选择器：输入关键字实时筛选（防抖 300ms），选中后回填校名
export default function SchoolSelector({
  value,
  onChange,
  placeholder = "搜索学校名称，如：石门",
  initialSchoolName,
}: SchoolSelectorProps) {
  const [input, setInput] = useState(initialSchoolName ?? "");
  const [schools, setSchools] = useState<School[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 受控回显：外部 value 变化且用户未输入过时，同步显示名
  useEffect(() => {
    if (!touched) setInput(initialSchoolName ?? "");
  }, [initialSchoolName, touched]);

  // 防抖搜索：300ms 内仅触发最后一次
  useEffect(() => {
    if (!touched) return;
    const keyword = input.trim();
    if (!keyword) {
      setSchools([]);
      setOpen(false);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void searchSchools(keyword);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, touched]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchSchools = async (keyword: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/master-data/schools?search=${encodeURIComponent(keyword)}`
      );
      const data = await res.json();
      setSchools(data.data || []);
      setOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "搜索学校失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (s: School) => {
    setInput(s.name);
    setTouched(false);
    setOpen(false);
    onChange(s.id, s);
  };

  const handleClear = () => {
    setInput("");
    setTouched(false);
    setSchools([]);
    setOpen(false);
    onChange("", null);
  };

  // 打开新增学校弹窗：关闭下拉，保留当前输入作为默认校名
  const handleOpenCreate = () => {
    setOpen(false);
    setShowCreateModal(true);
  };

  // 新学校创建成功：选中并关闭弹窗
  const handleCreated = (school: School) => {
    setShowCreateModal(false);
    handleSelect(school);
  };

  const inputClass =
    "w-full pl-10 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none";

  return (
    <div ref={containerRef} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setTouched(true);
        }}
        onFocus={() => {
          if (schools.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className={inputClass}
        autoComplete="off"
      />
      {(input || value) && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          aria-label="清空"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {loading && (
        <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 text-shibu-500 animate-spin" />
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-sm text-gray-400 flex items-center">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> 搜索中...
            </div>
          ) : schools.length > 0 ? (
            schools.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 hover:bg-shibu-50 border-b border-gray-50 last:border-0"
              >
                <div className="text-sm text-gray-900">{s.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {buildSubtitle(s)}
                </div>
              </button>
            ))
          ) : (
            <div className="p-3 text-sm text-gray-400">未找到匹配学校</div>
          )}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full text-left px-3 py-2 border-t border-gray-100 text-sm text-shibu-600 hover:bg-shibu-50 flex items-center gap-1 sticky bottom-0 bg-white"
          >
            <Plus className="w-4 h-4" /> 添加新学校
          </button>
        </div>
      )}

      {showCreateModal && (
        <SchoolCreateModal
          defaultName={input.trim()}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
