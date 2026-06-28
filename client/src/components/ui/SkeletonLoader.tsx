import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

export function SkeletonLoader({ className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`skeleton ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="card w-full flex flex-col gap-4">
      <SkeletonLoader className="h-6 w-1/3" />
      <SkeletonLoader className="h-4 w-1/2" />
      <div className="mt-4 flex gap-4">
        <SkeletonLoader className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-full" />
          <SkeletonLoader className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
          <SkeletonLoader className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-4 w-1/3" />
            <SkeletonLoader className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
