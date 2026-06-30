"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";
import { Upload, Download, CheckCircle, XCircle, FileText } from "lucide-react";

export default function ImportPage() {
  const { status } = useSession();
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (status === "unauthenticated") redirect("/login");

  const handlePreview = async () => {
    if (!csvText.trim()) {
      toast.error("请粘贴CSV数据");
      return;
    }

    try {
      const res = await fetch("/api/import", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data.data);
      setResult(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);

    try {
      // 从csv重新解析完整数据
      const lines = csvText.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const students = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || "";
        });
        return row;
      });

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.data);
      toast.success(data.message || "导入完成");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shibu-600" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">批量导入学生</h1>
        <p className="text-sm text-gray-500 mt-1">
          通过CSV格式批量创建学生档案
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">操作步骤</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            { step: "1", text: "按格式准备CSV数据", icon: FileText },
            { step: "2", text: "粘贴并预览", icon: Upload },
            { step: "3", text: "确认导入", icon: CheckCircle },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-2 text-gray-600">
              <div className="w-6 h-6 rounded-full bg-shibu-100 text-shibu-600 flex items-center justify-center text-xs font-bold">
                {item.step}
              </div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CSV格式示例 */}
      <div className="bg-shibu-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-shibu-700">CSV格式示例</p>
          <button
            onClick={() => {
              const sample = `姓名,年级,学校,家长姓名,联系电话,家长微信,教材版本,当前成绩,家长期望
张三,初一,实验中学,张妈妈,13800138000,zhangmom,人教版,班级第15名,希望进入前10
李四,初二,一中,李爸爸,13900139000,libaba,北师大版,班级第8名,稳定在前10`;
              setCsvText(sample);
            }}
            className="text-xs text-shibu-600 hover:text-shibu-700"
          >
            点击填入示例数据
          </button>
        </div>
        <pre className="text-xs text-gray-600 bg-white rounded p-3 overflow-x-auto">
{`姓名,年级,学校,家长姓名,联系电话,家长微信,教材版本,当前成绩
张三,初一,实验中学,张妈妈,13800138000,zhangmom,人教版,班级第15名
李四,初二,一中,李爸爸,13900139000,libaba,北师大版,班级第8名`}
        </pre>
      </div>

      {/* CSV输入 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          粘贴CSV数据
        </label>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-mono"
          rows={8}
          placeholder="在此粘贴CSV格式的学生数据..."
        />
        <div className="flex gap-3 mt-3">
          <button
            onClick={handlePreview}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            预览数据
          </button>
          {preview && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {importing ? "导入中..." : `确认导入 ${preview.total} 名学生`}
            </button>
          )}
        </div>
      </div>

      {/* 预览 */}
      {preview && !result && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            预览（共 {preview.total} 行）
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {preview.headers.map((h: string) => (
                    <th key={h} className="text-left px-3 py-2 text-xs text-gray-500 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50">
                    {preview.headers.map((h: string) => (
                      <td key={h} className="px-3 py-2 text-sm text-gray-700">
                        {row[h] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.total > 5 && (
            <p className="text-xs text-gray-400 mt-2">
              显示前5行，共 {preview.total} 行
            </p>
          )}
        </div>
      )}

      {/* 导入结果 */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">导入结果</h2>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm">成功：{result.success} 名</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm">失败：{result.failed} 名</span>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-3 bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-600 font-medium mb-1">错误详情：</p>
              <ul className="list-disc list-inside text-xs text-red-500 space-y-0.5">
                {result.errors.map((e: string, i: number) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          {result.success > 0 && (
            <a
              href="/dashboard/students"
              className="inline-block mt-4 px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700"
            >
              查看学生列表
            </a>
          )}
        </div>
      )}
    </div>
  );
}
