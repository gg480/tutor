"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import {
  ScoreRecord,
  SHIBU_PRIMARY_COLOR,
  GRAY_LINE_COLOR,
} from "./shared";

interface ScoreChartProps {
  studentId: string;
  trainingSubjectIds: string[]; // 培训学科的 subjectId 数组，用于高亮
}

interface DataPoint {
  date: string;
  percent: number;
}

interface Series {
  subjectId: string;
  subjectName: string;
  isTraining: boolean;
  points: DataPoint[]; // 按日期升序
}

const VIEW_W = 800;
const VIEW_H = 400;
const PAD_L = 50;
const PAD_R = 20;
const PAD_T = 30;
const PAD_B = 50;
const PLOT_W = VIEW_W - PAD_L - PAD_R;
const PLOT_H = VIEW_H - PAD_T - PAD_B;
const Y_TICKS = [0, 20, 40, 60, 80, 100];
const MIN_RECORDS = 3;

// 把成绩记录按学科分组并计算得分率序列
function buildSeries(
  records: ScoreRecord[],
  trainingSubjectIds: string[]
): Series[] {
  const trainingSet = new Set(trainingSubjectIds);
  const map = new Map<string, { name: string; points: DataPoint[] }>();
  records.forEach((r) => {
    if (r.fullScore <= 0) return;
    const name = r.subjectName ?? r.subjectId;
    const entry = map.get(r.subjectId) ?? { name, points: [] };
    entry.points.push({
      date: r.examDate,
      percent: Math.round((r.score / r.fullScore) * 1000) / 10,
    });
    map.set(r.subjectId, entry);
  });
  const series: Series[] = [];
  map.forEach((points, subjectId) => {
    points.points.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    series.push({
      subjectId,
      subjectName: points.name,
      isTraining: trainingSet.has(subjectId),
      points: points.points,
    });
  });
  return series;
}

// 收集所有日期并升序排序
function collectAllDates(series: Series[]): string[] {
  const set = new Set<string>();
  series.forEach((s) => s.points.forEach((p) => set.add(p.date)));
  return Array.from(set).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
}

// 计算 X 坐标
function computeX(date: string, allDates: string[]): number {
  const idx = allDates.indexOf(date);
  if (allDates.length <= 1) return PAD_L + PLOT_W / 2;
  return PAD_L + (idx / (allDates.length - 1)) * PLOT_W;
}

// 计算 Y 坐标（0-100 映射到画布）
function computeY(percent: number): number {
  const clamped = Math.max(0, Math.min(100, percent));
  return PAD_T + (1 - clamped / 100) * PLOT_H;
}

// 渲染坐标轴与网格
function ChartAxes({ allDates }: { allDates: string[] }) {
  return (
    <g>
      {Y_TICKS.map((tick) => {
        const y = computeY(tick);
        return (
          <g key={tick}>
            <line
              x1={PAD_L}
              y1={y}
              x2={VIEW_W - PAD_R}
              y2={y}
              stroke="#f3f4f6"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={11}
              fill="#9ca3af"
            >
              {tick}
            </text>
          </g>
        );
      })}
      {allDates.map((d, i) => {
        const x = computeX(d, allDates);
        const label = new Date(d).toLocaleDateString("zh-CN", {
          month: "2-digit",
          day: "2-digit",
        });
        return (
          <text
            key={d}
            x={x}
            y={VIEW_H - PAD_B + 18}
            textAnchor="middle"
            fontSize={11}
            fill="#9ca3af"
          >
            {label}
          </text>
        );
      })}
    </g>
  );
}

// 渲染单条折线与数据点
function LinePath({ s, allDates }: { s: Series; allDates: string[] }) {
  const color = s.isTraining ? SHIBU_PRIMARY_COLOR : GRAY_LINE_COLOR;
  const dasharray = s.isTraining ? "none" : "5,3";
  const path = s.points
    .map((p, i) => {
      const x = computeX(p.date, allDates);
      const y = computeY(p.percent);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={s.isTraining ? 2.5 : 1.5}
        strokeDasharray={dasharray}
      />
      {s.points.map((p, i) => {
        const x = computeX(p.date, allDates);
        const y = computeY(p.percent);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={s.isTraining ? 3.5 : 2.5}
            fill={color}
          />
        );
      })}
    </g>
  );
}

// 图例
function ChartLegend({ series }: { series: Series[] }) {
  return (
    <div className="flex flex-wrap gap-3 mt-3 justify-center">
      {series.map((s) => (
        <div key={s.subjectId} className="flex items-center gap-1.5 text-xs">
          <svg width="20" height="8">
            <line
              x1="0"
              y1="4"
              x2="20"
              y2="4"
              stroke={s.isTraining ? SHIBU_PRIMARY_COLOR : GRAY_LINE_COLOR}
              strokeWidth="2"
              strokeDasharray={s.isTraining ? "none" : "5,3"}
            />
          </svg>
          <span
            className={
              s.isTraining ? "text-shibu-700 font-medium" : "text-gray-500"
            }
          >
            {s.subjectName}
            {s.isTraining && (
              <span className="ml-1 text-shibu-600">（培训）</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ScoreChart({
  studentId,
  trainingSubjectIds,
}: ScoreChartProps) {
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadScores(studentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const loadScores = async (sid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${sid}/scores`);
      const data = await res.json();
      setRecords(data.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载成绩曲线失败");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex items-center justify-center text-gray-400">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        加载成绩曲线...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-sm text-gray-400">
        暂无成绩数据
      </div>
    );
  }

  if (records.length < MIN_RECORDS) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-sm text-gray-400">
        暂无足够数据绘制曲线（至少需要 {MIN_RECORDS} 条成绩记录，当前{" "}
        {records.length} 条）
      </div>
    );
  }

  const series = buildSeries(records, trainingSubjectIds);
  const validSeries = series.filter((s) => s.points.length >= 1);
  // 培训学科在前
  validSeries.sort((a, b) => {
    if (a.isTraining && !b.isTraining) return -1;
    if (!a.isTraining && b.isTraining) return 1;
    return a.subjectName.localeCompare(b.subjectName);
  });
  const allDates = collectAllDates(validSeries);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-shibu-50">
        <TrendingUp className="w-4 h-4 text-shibu-600" />
        <h3 className="text-sm font-semibold text-shibu-700">成绩趋势曲线</h3>
        <span className="ml-auto text-xs text-gray-500">
          按得分率（%）绘制
        </span>
      </div>
      <div className="p-4">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <ChartAxes allDates={allDates} />
          {validSeries.map((s) => (
            <LinePath key={s.subjectId} s={s} allDates={allDates} />
          ))}
        </svg>
        <ChartLegend series={validSeries} />
      </div>
    </div>
  );
}
