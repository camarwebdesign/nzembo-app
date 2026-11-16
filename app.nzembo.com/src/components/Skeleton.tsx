"use client";

import React from "react";

/**
 * Reusable modular Skeleton components with Shimmer effect
 * Matches exact layouts of cards, lists, stats, and profile widgets.
 */

export function SkeletonBox({
  className = "",
  rounded = "rounded-lg",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`shimmer bg-slate-200 dark:bg-[#261E38] ${rounded} ${className}`}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white dark:bg-nzembo-card/50 p-5 rounded-2xl border border-slate-200/80 dark:border-nzembo-violet/15 text-center shadow-sm space-y-2">
      <SkeletonBox className="h-8 w-14 mx-auto" />
      <SkeletonBox className="h-3 w-28 mx-auto" rounded="rounded" />
    </div>
  );
}

export function SkeletonSongCard() {
  return (
    <div className="bg-white dark:bg-nzembo-card/50 p-4 rounded-xl border border-slate-200/80 dark:border-nzembo-violet/15 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <SkeletonBox className="w-10 h-10 flex-shrink-0" rounded="rounded-xl" />
        <div className="space-y-2 flex-1 min-w-0">
          <SkeletonBox className="h-4 w-3/4 max-w-xs" />
          <SkeletonBox className="h-3 w-1/2 max-w-sm" rounded="rounded" />
        </div>
      </div>
      <SkeletonBox className="w-6 h-6 flex-shrink-0" rounded="rounded-full" />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="bg-white dark:bg-nzembo-card/50 p-6 rounded-2xl border border-slate-200/80 dark:border-nzembo-violet/15 flex items-center gap-4 shadow-sm">
      <SkeletonBox className="w-16 h-16 flex-shrink-0" rounded="rounded-full" />
      <div className="space-y-2 flex-1">
        <SkeletonBox className="h-5 w-40" />
        <SkeletonBox className="h-3.5 w-52" rounded="rounded" />
      </div>
    </div>
  );
}

export function SkeletonWizard() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBox className="h-6 w-48" />
        <SkeletonBox className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-slate-200 dark:border-nzembo-violet/15 bg-white dark:bg-nzembo-card/40 space-y-2"
          >
            <SkeletonBox className="w-8 h-8" rounded="rounded-lg" />
            <SkeletonBox className="h-4 w-28" />
            <SkeletonBox className="h-3 w-36" rounded="rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
