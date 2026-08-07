'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('bg-muted/60 animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-7 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="glass-card">
              <CardHeader>
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export function JobsListSkeleton() {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-7 w-28 mb-1" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Filters Skeleton */}
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 flex-1 min-w-[200px]" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Skeleton className="h-5 w-24 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="space-y-2 mb-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EstimatesListSkeleton() {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-7 w-28 mb-1" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 flex-1 min-w-[200px]" />
        </div>

        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-28 mb-2" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-7 w-24 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[...Array(35)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="glass-card">
              <CardHeader>
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
