"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  ChapterNode,
  DEFAULT_REGION,
  LABEL_CLASS,
} from "./shared";

interface ExamRangeSelectorProps {
  gradeId: string;
  subjectId: string;
  value: string[]; // 已选章节 id 数组
  onChange: (ids: string[]) => void;
}

// 递归渲染单个章节树节点（含子节点）
function ChapterTreeItem({
  node,
  selectedIds,
  onToggle,
  depth,
}: {
  node: ChapterNode;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  depth: number;
}) {
  const checked = selectedIds.has(node.id);
  return (
    <div>
      <label
        className="flex items-center gap-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded px-2 cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(node.id)}
          className="w-4 h-4 rounded border-gray-300 text-shibu-600 focus:ring-shibu-500"
        />
        <span className="text-xs text-gray-400">{node.chapterNo}</span>
        <span className={checked ? "font-medium text-shibu-700" : ""}>
          {node.chapterName}
        </span>
      </label>
      {node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <ChapterTreeItem
              key={child.id}
              node={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 加载教材版本，返回 id 与版本名（如"人教版"），未配置返回 null
async function fetchTextbookVersion(
  gradeId: string,
  subjectId: string
): Promise<{ id: string; version: string } | null> {
  const res = await fetch(
    `/api/master-data/textbooks?region=${encodeURIComponent(
      DEFAULT_REGION
    )}&gradeId=${encodeURIComponent(gradeId)}&subjectId=${encodeURIComponent(subjectId)}`
  );
  const data = await res.json();
  const list = (data.data ?? []) as { id: string; version: string }[];
  return list.length > 0 ? { id: list[0].id, version: list[0].version } : null;
}

// 加载章节树
async function fetchChapterTree(
  textbookVersionId: string
): Promise<ChapterNode[]> {
  const res = await fetch(
    `/api/master-data/chapters?textbookVersionId=${encodeURIComponent(
      textbookVersionId
    )}`
  );
  const data = await res.json();
  return (data.data ?? []) as ChapterNode[];
}

export default function ExamRangeSelector({
  gradeId,
  subjectId,
  value,
  onChange,
}: ExamRangeSelectorProps) {
  const [chapters, setChapters] = useState<ChapterNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [versionLabel, setVersionLabel] = useState<string>("");

  useEffect(() => {
    if (!gradeId || !subjectId) {
      setChapters([]);
      setVersionLabel("");
      return;
    }
    void loadChapters(gradeId, subjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeId, subjectId]);

  const loadChapters = async (gid: string, sid: string) => {
    setLoading(true);
    try {
      const tv = await fetchTextbookVersion(gid, sid);
      if (!tv) {
        toast.error("未找到该年级学科的教材版本配置");
        setChapters([]);
        setVersionLabel("");
        return;
      }
      setVersionLabel(tv.version);
      const tree = await fetchChapterTree(tv.id);
      setChapters(tree);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载章节树失败");
    } finally {
      setLoading(false);
    }
  };

  const selectedSet = new Set(value);
  const handleToggle = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  if (loading) {
    return (
      <div className="flex items-center text-sm text-gray-400 py-2">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        加载章节树...
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <p className="text-xs text-gray-400 py-2">
        暂无章节数据（{DEFAULT_REGION} · 教材版本：{versionLabel || "未配置"}）
      </p>
    );
  }

  return (
    <div>
      <label className={LABEL_CLASS}>
        考试范围（可选）
        <span className="ml-2 text-xs text-gray-400 font-normal">
          已选 {value.length} 章
        </span>
      </label>
      <div className="border border-gray-200 rounded-lg p-2 max-h-60 overflow-y-auto bg-gray-50/50">
        {chapters.map((node) => (
          <ChapterTreeItem
            key={node.id}
            node={node}
            selectedIds={selectedSet}
            onToggle={handleToggle}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}
