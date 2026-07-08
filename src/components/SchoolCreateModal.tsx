"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { School, SCHOOL_LEVELS } from "@/app/dashboard/master-data/types";
import { INPUT_CLASS, LABEL_CLASS } from "@/components/student-detail/shared";

interface SchoolCreateModalProps {
  onClose: () => void;
  onCreated: (school: School) => void;
  defaultName?: string;
}

// 重点学校等级选项
const KEY_LEVELS = ["省一级", "市一级", "区一级"];

// 学校新增表单：name/town/level 必填，district 默认南海区
export default function SchoolCreateModal({
  onClose,
  onCreated,
  defaultName = "",
}: SchoolCreateModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: defaultName,
    district: "南海区",
    town: "",
    level: "",
    isKey: false,
    keyLevel: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("请填写学校名称");
      return;
    }
    if (!form.town.trim()) {
      toast.error("请填写所在镇街");
      return;
    }
    if (!form.level) {
      toast.error("请选择学段");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        district: form.district.trim() || "南海区",
        town: form.town.trim(),
        level: form.level,
        isKey: form.isKey,
        keyLevel: form.isKey && form.keyLevel ? form.keyLevel : null,
        address: form.address.trim() || null,
      };
      const res = await fetch("/api/master-data/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "创建失败");
      toast.success("学校已创建");
      onCreated(data.data as School);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建学校失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">添加新学校</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>
              学校名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={INPUT_CLASS}
              placeholder="如：石门中学"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>区/县</label>
              <input
                type="text"
                value={form.district}
                onChange={(e) =>
                  setForm({ ...form, district: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>
                所在镇街 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.town}
                onChange={(e) => setForm({ ...form, town: e.target.value })}
                className={INPUT_CLASS}
                placeholder="如：桂城"
              />
            </div>
          </div>
          <div>
            <label className={LABEL_CLASS}>
              学段 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className={INPUT_CLASS}
              required
            >
              <option value="">请选择</option>
              {SCHOOL_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isKey}
                onChange={(e) =>
                  setForm({ ...form, isKey: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 text-shibu-600 focus:ring-shibu-500"
              />
              重点学校
            </label>
            {form.isKey && (
              <select
                value={form.keyLevel}
                onChange={(e) =>
                  setForm({ ...form, keyLevel: e.target.value })
                }
                className={`${INPUT_CLASS} max-w-[160px]`}
              >
                <option value="">重点等级（可选）</option>
                {KEY_LEVELS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={LABEL_CLASS}>地址（可选）</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700 disabled:opacity-50 flex items-center gap-1"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? "提交中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
