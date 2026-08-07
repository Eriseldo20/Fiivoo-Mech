'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'
import { CardSkeleton, TableSkeleton } from '@/components/skeletons/page-skeletons'
import { Skeleton } from '@/components/ui/skeleton'

// Loading components for dynamic imports
function FormLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

function CalendarLoadingSkeleton() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-10 w-full" />
        ))}
        {[...Array(35)].map((_, i) => (
          <Skeleton key={`cell-${i}`} className="h-20 w-full" />
        ))}
      </div>
    </div>
  )
}

function ChartLoadingSkeleton() {
  return (
    <div className="p-4">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

// Lazy loaded components with custom loading states
export const LazyEstimateForm = dynamic(
  () => import('@/components/estimates/estimate-form').then(mod => mod.EstimateForm),
  {
    loading: () => <FormLoadingSkeleton />,
    ssr: false, // Forms often have client-only logic
  }
)

export const LazyJobForm = dynamic(
  () => import('@/components/jobs/job-form').then(mod => mod.JobForm),
  {
    loading: () => <FormLoadingSkeleton />,
    ssr: false,
  }
)

export const LazyPhotoUpload = dynamic(
  () => import('@/components/vehicles/photo-upload').then(mod => mod.PhotoUpload),
  {
    loading: () => (
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <Skeleton className="h-8 w-8 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    ),
    ssr: false,
  }
)

export const LazyVinLookup = dynamic(
  () => import('@/components/jobs/vin-lookup').then(mod => mod.VinLookup),
  {
    loading: () => <Skeleton className="h-10 w-full" />,
    ssr: false,
  }
)

// Export a helper for creating lazy components with custom loading
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | { [key: string]: T }>,
  exportName?: string,
  LoadingComponent?: ComponentType
) {
  return dynamic(
    async () => {
      const mod = await importFn()
      return exportName ? (mod as any)[exportName] : mod
    },
    {
      loading: LoadingComponent ? () => <LoadingComponent /> : () => <CardSkeleton />,
      ssr: true,
    }
  )
}
