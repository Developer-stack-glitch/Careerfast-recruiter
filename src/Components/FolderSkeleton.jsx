'use client';
import React from 'react';

// Single folder row skeleton
export function FolderRowSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs flex items-center justify-between gap-4">
      {/* Folder Name & Info */}
      <div className="w-[300px] shrink-0 flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-xl bg-slate-200/80 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 rounded-md bg-slate-200/80" />
          <div className="h-3 w-1/2 rounded-md bg-slate-100" />
        </div>
      </div>

      {/* Candidate Pipeline Badges */}
      <div className="flex-1 flex items-center justify-center gap-2 px-4">
        <div className="h-8 w-20 rounded-xl bg-blue-50/80 border border-blue-100/50" />
        <div className="h-8 w-24 rounded-xl bg-emerald-50/80 border border-emerald-100/50" />
        <div className="h-8 w-24 rounded-xl bg-sky-50/80 border border-sky-100/50" />
        <div className="h-8 w-24 rounded-xl bg-amber-50/80 border border-amber-100/50" />
      </div>

      {/* Campaigns */}
      <div className="w-[160px] shrink-0 flex items-center justify-center">
        <div className="h-7 w-20 rounded-lg bg-slate-100" />
      </div>

      {/* Actions */}
      <div className="w-[100px] shrink-0 flex items-center justify-end gap-2 pr-2">
        <div className="h-8 w-8 rounded-lg bg-slate-100" />
        <div className="h-8 w-8 rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

// Table of folder row skeletons
export function FolderTableSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <FolderRowSkeleton key={i} />
      ))}
    </div>
  );
}

// Pipeline drawer candidates skeleton
export function CandidateDrawerSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs space-y-4"
        >
          {/* Top row: Avatar + Name + Stage Pill */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-200/80 shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-36 rounded-md bg-slate-200/80" />
                <div className="h-3 w-48 rounded-md bg-slate-100" />
              </div>
            </div>
            <div className="h-7 w-24 rounded-full bg-slate-100" />
          </div>

          {/* Meta tags: Location, Experience, Notice */}
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="h-6 w-24 rounded-lg bg-slate-100" />
            <div className="h-6 w-20 rounded-lg bg-slate-100" />
            <div className="h-6 w-28 rounded-lg bg-slate-100" />
          </div>

          {/* Skills pills */}
          <div className="flex flex-wrap gap-1.5">
            <div className="h-5 w-16 rounded-md bg-slate-100" />
            <div className="h-5 w-20 rounded-md bg-slate-100" />
            <div className="h-5 w-14 rounded-md bg-slate-100" />
            <div className="h-5 w-18 rounded-md bg-slate-100" />
          </div>

          {/* Action buttons footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="h-8 w-28 rounded-lg bg-slate-100" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 rounded-lg bg-slate-100" />
              <div className="h-8 w-24 rounded-lg bg-blue-100/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Complete Folders Page Skeleton (for loading.jsx & initial transitions)
export function FolderPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8fafd] flex flex-col w-full">
      {/* Top Navbar Skeleton Placeholder */}
      <div className="h-16 w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-8">
          <div className="h-8 w-32 rounded-lg bg-slate-200/80" />
          <div className="hidden md:flex items-center gap-3">
            <div className="h-7 w-20 rounded-lg bg-slate-100" />
            <div className="h-7 w-20 rounded-lg bg-slate-100" />
            <div className="h-7 w-20 rounded-lg bg-blue-50/80" />
            <div className="h-7 w-20 rounded-lg bg-slate-100" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100" />
          <div className="h-9 w-9 rounded-full bg-slate-200/80" />
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          <div className="space-y-2.5">
            <div className="h-7 w-48 rounded-lg bg-slate-200/90" />
            <div className="h-4 w-80 rounded-md bg-slate-200/60" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-36 rounded-xl bg-slate-200/80" />
            <div className="h-10 w-32 rounded-xl bg-[#0A66C2]/30" />
          </div>
        </div>

        {/* Category Tabs Bar */}
        <div className="border-b border-slate-200/90 flex items-center gap-7 pt-1 pb-3.5">
          <div className="h-5 w-36 rounded-md bg-slate-200/80" />
          <div className="h-5 w-36 rounded-md bg-slate-200/50" />
          <div className="h-5 w-36 rounded-md bg-slate-200/50" />
        </div>

        {/* White Main Card Container */}
        <div className="mt-7 rounded-2xl bg-white p-4 sm:p-6 shadow-xs border border-slate-200/80">
          {/* Controls Bar: Search & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div className="h-10 w-full sm:w-80 rounded-xl bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-36 rounded-xl bg-slate-100" />
              <div className="h-10 w-20 rounded-xl bg-slate-100" />
            </div>
          </div>

          {/* Table Header Bar */}
          <div className="overflow-x-auto pb-1">
            <div className="min-w-[1100px]">
              <div className="rounded-xl bg-[#f8fafd] px-6 py-3 flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-slate-200/80" />
                <div className="h-4 w-40 rounded bg-slate-200/80" />
                <div className="h-4 w-24 rounded bg-slate-200/80" />
                <div className="h-4 w-16 rounded bg-slate-200/80" />
              </div>

              {/* Table Rows */}
              <div className="mt-3 space-y-3">
                <FolderTableSkeleton count={5} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Saved Candidates list skeleton
export function SavedCandidatesListSkeleton({ count = 5 }) {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-2xs gap-4"
        >
          {/* Avatar & candidate info */}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-lg bg-slate-200/80 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-48 rounded bg-slate-200/80" />
              <div className="h-3.5 w-32 rounded bg-slate-100" />
              <div className="flex items-center gap-4 pt-1">
                <div className="h-3 w-20 rounded bg-slate-100" />
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-3 w-36 rounded bg-slate-100" />
              </div>
            </div>
          </div>

          {/* Action buttons on right */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 rounded-lg bg-slate-100" />
            <div className="h-9 w-28 rounded-lg bg-blue-50/80" />
            <div className="h-9 w-9 rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Saved candidates full page skeleton
export function SavedCandidatesPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col w-full animate-pulse">
      {/* Top Navbar Skeleton Placeholder */}
      <div className="h-16 w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-slate-200/80" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100" />
          <div className="h-9 w-9 rounded-full bg-slate-200/80" />
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between pb-6">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-lg bg-slate-200/90" />
            <div className="h-4 w-72 rounded-md bg-slate-200/60" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-slate-200/80" />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-3 pb-2">
            <div className="h-10 w-80 rounded-xl bg-slate-100" />
            <div className="h-10 w-36 rounded-xl bg-slate-100" />
          </div>
          <SavedCandidatesListSkeleton count={5} />
        </div>
      </main>
    </div>
  );
}

export default FolderTableSkeleton;
