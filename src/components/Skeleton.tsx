"use client";

import { cn } from "@/lib/utils";

/** 单个骨架块 */
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse bg-gray-200 rounded", className)}
    />
  );
}

/** 骨架卡片 */
function SkeletonCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      {children || (
        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-8 w-1/2" />
          <SkeletonBlock className="h-3 w-2/3" />
        </div>
      )}
    </div>
  );
}

/** 骨架表格行 */
function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-4 py-3 border-b border-gray-50">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBlock key={i} className={cn("h-4", i === 0 ? "w-1/4" : "flex-1")} />
      ))}
    </div>
  );
}

/** 页面级骨架屏 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="h-4 w-60" />
        </div>
        <SkeletonBlock className="h-10 w-28 rounded-lg" />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-8 w-12" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* 内容区 */}
      <SkeletonCard>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonTableRow key={i} cols={4} />
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}

/** 列表页骨架屏 */
export function ListSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-32" />
          <SkeletonBlock className="h-4 w-48" />
        </div>
        <SkeletonBlock className="h-10 w-28 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="flex items-center gap-4">
              <SkeletonBlock className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-1/3" />
                <SkeletonBlock className="h-3 w-1/2" />
              </div>
              <SkeletonBlock className="h-6 w-16 rounded-full" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

/** 详情页骨架屏 */
export function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonCard>
        <div className="flex items-center gap-4">
          <SkeletonBlock className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-4 w-60" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}>
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-5 w-12 mt-1" />
            </SkeletonCard>
          ))}
        </div>
      </SkeletonCard>
      <SkeletonCard>
        <div className="space-y-3">
          <SkeletonBlock className="h-5 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-16 w-full" />
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}

export { SkeletonBlock, SkeletonCard, SkeletonTableRow };
