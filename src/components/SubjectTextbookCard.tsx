"use client";

import { useEffect, useState } from "react";
import { BookOpen, Loader2, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  Grade,
  Subject,
  TextbookVersion,
  EXAM_TYPES,
} from "@/app/dashboard/master-data/types";

interface SubjectTextbookCardProps {
  region: string;
  gradeId?: string;
}

interface SubjectRow {
  subjectId: string;
  subjectName: string;
  textbookId: string | null;
  version: string | null;
  publisher: string | null;
  examLabels: string[];
}

// 可选教材版本（与主数据常见版本对齐）
const VERSION_OPTIONS: string[] = [
  "人教版",
  "北师大版",
  "外研版",
  "粤教版",
  "沪粤版",
  "湘教版",
  "苏教版",
  "其他",
];

const EXAM_LABEL_MAP: Record<string, string> = Object.fromEntries(
  EXAM_TYPES.map((e) => [e.value, e.label])
);

// 把逗号分隔的考试类型字符串转中文标签数组
function parseExamLabels(raw: string): string[] {
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((v) => EXAM_LABEL_MAP[v] ?? v);
}

// 关联学科与教材版本：按 subjectId 匹配
function buildRows(
  subjects: Subject[],
  textbooks: TextbookVersion[]
): SubjectRow[] {
  const textbookMap = new Map<string, TextbookVersion>();
  textbooks.forEach((t) => textbookMap.set(t.subjectId, t));
  return subjects.map((s) => {
    const tb = textbookMap.get(s.id);
    return {
      subjectId: s.id,
      subjectName: s.name,
      textbookId: tb?.id ?? null,
      version: tb?.version ?? null,
      publisher: tb?.publisher ?? null,
      examLabels: parseExamLabels(s.examTypes),
    };
  });
}

// 保存教材版本：已有 textbookId 走 PUT，无则 POST 新建
async function saveTextbookVersion(params: {
  textbookId: string | null;
  region: string;
  gradeId: string;
  subjectId: string;
  version: string;
}): Promise<void> {
  const { textbookId, region, gradeId, subjectId, version } = params;
  if (textbookId) {
    const res = await fetch(`/api/master-data/textbooks/${textbookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "更新教材版本失败");
    }
  } else {
    const res = await fetch(`/api/master-data/textbooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region, gradeId, subjectId, version }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "创建教材版本失败");
    }
  }
}

// 教材版本单元格：展示 + 编辑切换
function TextbookVersionCell({
  row,
  region,
  gradeId,
  onSaved,
}: {
  row: SubjectRow;
  region: string;
  gradeId: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editVersion, setEditVersion] = useState<string>(row.version ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (version: string) => {
    if (!version) {
      toast.error("请选择教材版本");
      return;
    }
    setSaving(true);
    try {
      await saveTextbookVersion({
        textbookId: row.textbookId,
        region,
        gradeId,
        subjectId: row.subjectId,
        version,
      });
      toast.success("教材版本已保存");
      setEditing(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存教材版本失败");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <select
          value={editVersion}
          onChange={(e) => setEditVersion(e.target.value)}
          disabled={saving}
          className="px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none"
        >
          <option value="">请选择</option>
          {VERSION_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => handleSave(editVersion)}
          disabled={saving || !editVersion}
          className="text-xs px-2 py-1 bg-shibu-600 text-white rounded hover:bg-shibu-700 disabled:opacity-50"
        >
          {saving ? "保存中" : "保存"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setEditVersion(row.version ?? "");
          }}
          disabled={saving}
          className="text-gray-400 hover:text-gray-600"
          aria-label="取消"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (row.version) {
    return (
      <div className="flex items-center gap-1">
        <span>
          {row.version}
          {row.publisher && (
            <span className="text-xs text-gray-400 ml-1">
              ({row.publisher})
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            setEditVersion(row.version ?? "");
            setEditing(true);
          }}
          className="text-gray-400 hover:text-shibu-600"
          aria-label="编辑教材版本"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setEditVersion("");
        setEditing(true);
      }}
      className="text-xs text-shibu-600 hover:text-shibu-700"
    >
      点击配置
    </button>
  );
}

// 全科+教材版本展示卡：通过 region+gradeId 拉取学科和教材版本并表格展示
export default function SubjectTextbookCard({
  region,
  gradeId,
}: SubjectTextbookCardProps) {
  const [rows, setRows] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [gradeName, setGradeName] = useState<string>("");

  useEffect(() => {
    if (!gradeId) {
      setRows([]);
      setGradeName("");
      return;
    }
    void loadAll(gradeId, region);
  }, [gradeId, region]);

  const loadAll = async (gid: string, reg: string) => {
    setLoading(true);
    try {
      const gRes = await fetch(`/api/master-data/grades/${gid}`);
      const gData = await gRes.json();
      const grade: Grade | null = gData.data ?? null;
      if (!grade) {
        toast.error("年级不存在");
        setRows([]);
        return;
      }
      setGradeName(grade.name);
      const level = grade.level;

      const [sRes, tRes] = await Promise.all([
        fetch(`/api/master-data/subjects?level=${encodeURIComponent(level)}`),
        fetch(
          `/api/master-data/textbooks?region=${encodeURIComponent(
            reg
          )}&gradeId=${encodeURIComponent(gid)}`
        ),
      ]);
      const sData = await sRes.json();
      const tData = await tRes.json();
      setRows(buildRows(sData.data || [], tData.data || []));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载全科数据失败");
    } finally {
      setLoading(false);
    }
  };

  if (!gradeId) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-sm text-gray-400">
        请先选择年级
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex items-center justify-center text-gray-400">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        加载全科数据...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-sm text-gray-400">
        暂无该年级的学科数据
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-shibu-50">
        <BookOpen className="w-4 h-4 text-shibu-600" />
        <h3 className="text-sm font-semibold text-shibu-700">
          {region} · {gradeName} 全科与教材版本
        </h3>
        <span className="ml-auto text-xs text-gray-500">
          共 {rows.length} 科
        </span>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs text-gray-500">
            <th className="px-4 py-2 font-medium">学科</th>
            <th className="px-4 py-2 font-medium">教材版本</th>
            <th className="px-4 py-2 font-medium">考试标记</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.subjectId}
              className="border-t border-gray-50 hover:bg-gray-50"
            >
              <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                {r.subjectName}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700">
                <TextbookVersionCell
                  row={r}
                  region={region}
                  gradeId={gradeId}
                  onSaved={() => void loadAll(gradeId, region)}
                />
              </td>
              <td className="px-4 py-2 text-sm">
                {r.examLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {r.examLabels.map((label) => (
                      <span
                        key={label}
                        className="text-xs px-2 py-0.5 rounded-full bg-shibu-50 text-shibu-700"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">无</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
