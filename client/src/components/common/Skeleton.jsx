import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-card space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton({ height = 'h-64' }) {
  return (
    <div className={`w-full ${height} bg-slate-50 border border-[#E2E8F0] rounded-lg p-4 flex flex-col justify-between animate-pulse`}>
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="space-y-2 py-8">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-5/6" />
        <Skeleton className="h-2 w-4/6" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#E2E8F0] flex justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="divide-y divide-[#E2E8F0] p-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-3 flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}
