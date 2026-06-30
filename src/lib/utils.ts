import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化日期
export function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 格式化日期时间
export function formatDateTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 获取中文掌握度标签
export function getMasteryLabel(level: number) {
  const labels = ["", "完全不会", "较弱", "一般", "较好", "熟练掌握"];
  return labels[level] ?? "未知";
}

// 获取中文学习状态
export function getMoodLabel(mood: string) {
  const labels: Record<string, string> = {
    good: "状态好",
    normal: "一般",
    bad: "状态差",
  };
  return labels[mood] ?? "未知";
}

// 获取错因中文名
export function getErrorTypeLabel(type: string) {
  const labels: Record<string, string> = {
    careless: "粗心大意",
    concept: "概念不清",
    approach: "思路不对",
    unknown: "完全不会",
  };
  return labels[type] ?? "未知";
}

// 获取错误类型颜色
export function getErrorTypeColor(type: string) {
  const colors: Record<string, string> = {
    careless: "bg-yellow-100 text-yellow-800",
    concept: "bg-red-100 text-red-800",
    approach: "bg-blue-100 text-blue-800",
    unknown: "bg-gray-100 text-gray-800",
  };
  return colors[type] ?? "bg-gray-100 text-gray-800";
}

// 获取掌握度颜色
export function getMasteryColor(level: number) {
  if (level <= 1) return "bg-red-100 text-red-800";
  if (level <= 2) return "bg-orange-100 text-orange-800";
  if (level <= 3) return "bg-yellow-100 text-yellow-800";
  if (level <= 4) return "bg-blue-100 text-blue-800";
  return "bg-green-100 text-green-800";
}
