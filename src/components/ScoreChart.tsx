"use client";

import { useMemo } from "react";
import { format } from "date-fns";

interface ScoreData {
  id: string;
  examName: string;
  examDate: string;
  subject: string;
  score: number;
  totalScore: number;
  examType: string;
}

interface Props {
  scores: ScoreData[];
  width?: number;
  height?: number;
}

/**
 * 成绩趋势折线图 — 纯 SVG 实现，无外部图表库依赖
 * 展示学生历次考试成绩的变化趋势
 */
export default function ScoreChart({
  scores,
  width = 600,
  height = 240,
}: Props) {
  const chartData = useMemo(() => {
    // 按日期排序
    const sorted = [...scores]
      .sort(
        (a, b) =>
          new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
      )
      .slice(-12); // 最多显示最近12次

    if (sorted.length === 0) return null;

    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // 计算 Y 轴范围
    const maxScore = Math.max(...sorted.map((s) => s.totalScore));
    const minY = 0;

    const points = sorted.map((s, i) => ({
      x: padding.left + (i / Math.max(sorted.length - 1, 1)) * chartW,
      y:
        padding.top +
        chartH -
        (s.score / maxScore) * chartH,
      label: s.examName.length > 6 ? s.examName.slice(0, 6) + "…" : s.examName,
      score: `${s.score}/${s.totalScore}`,
      date: format(new Date(s.examDate), "M/d"),
      subject: s.subject,
      type: s.examType,
    }));

    // Y 轴刻度
    const yTicks = [0, 25, 50, 75, 100].map((pct) => ({
      y: padding.top + chartH - (pct / 100) * chartH,
      label: Math.round((pct / 100) * maxScore),
    }));

    return { sorted, points, yTicks, chartW, chartH, padding, maxScore };
  }, [scores, width, height]);

  if (!chartData || chartData.sorted.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        至少需要 2 次成绩才能绘制趋势图
      </div>
    );
  }

  const { points, yTicks, chartW, chartH, padding } = chartData;

  // 折线路径
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // 面积填充路径
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    padding.top + chartH
  } L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={Math.max(width, points.length * 60)}
        height={height}
        className="text-gray-400"
      >
        {/* 网格线 */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={padding.left + chartW}
              y2={tick.y}
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray={i === 0 ? "" : "4 2"}
            />
            <text
              x={padding.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-gray-400 text-[11px]"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* 面积填充 */}
        <path d={areaPath} fill="url(#scoreGradient)" opacity={0.15} />

        {/* 折线 */}
        <path
          d={linePath}
          fill="none"
          stroke="#2C5385"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 数据点 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={4}
              className="fill-white stroke-shibu-500"
              strokeWidth={2.5}
            />
            {/* 鼠标悬停提示 */}
            <title>{`${p.label}\n${p.subject}: ${p.score}\n${p.date}`}</title>
            {/* X轴标签 */}
            <text
              x={p.x}
              y={padding.top + chartH + 16}
              textAnchor="end"
              transform={`rotate(-30, ${p.x}, ${padding.top + chartH + 16})`}
              className="fill-gray-400 text-[10px]"
            >
              {p.date}
            </text>
          </g>
        ))}

        {/* 渐变定义 */}
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2C5385" />
            <stop offset="100%" stopColor="#2C5385" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
