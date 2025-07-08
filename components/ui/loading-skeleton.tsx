"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  type: 'profile' | 'accounts' | 'transactions' | 'kpis' | 'timeline';
  className?: string;
}

export function LoadingSkeleton({ type, className }: LoadingSkeletonProps) {
  const skeletons = {
    profile: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    ),
    accounts: (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40 mb-3" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    transactions: (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40 mb-3" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    kpis: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-5 w-24 mb-3" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    ),
    timeline: (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="border rounded-lg">
            <div className="p-3 bg-muted/30 border-b">
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div className={cn("animate-pulse", className)}>
      {skeletons[type]}
    </div>
  );
}

// Skeletons específicos para formulários
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

// Skeleton para cards
export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// Skeleton para tabelas
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="text-right">
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 