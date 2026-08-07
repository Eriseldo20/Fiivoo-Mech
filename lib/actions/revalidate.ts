'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { CACHE_TAGS } from '@/lib/data/cached-queries'

// Revalidate specific cache tags
export async function revalidateJobs() {
  revalidateTag(CACHE_TAGS.JOBS, 'max')
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max')
}

export async function revalidateEstimates() {
  revalidateTag(CACHE_TAGS.ESTIMATES, 'max')
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max')
}

export async function revalidateCustomers() {
  revalidateTag(CACHE_TAGS.CUSTOMERS, 'max')
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max')
}

export async function revalidateVehicles() {
  revalidateTag(CACHE_TAGS.VEHICLES, 'max')
}

export async function revalidateInventory() {
  revalidateTag(CACHE_TAGS.INVENTORY, 'max')
}

export async function revalidateReminders() {
  revalidateTag(CACHE_TAGS.REMINDERS, 'max')
}

export async function revalidateDashboard() {
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max')
}

// Revalidate all caches
export async function revalidateAll() {
  Object.values(CACHE_TAGS).forEach(tag => {
    revalidateTag(tag, 'max')
  })
}

// Revalidate specific paths
export async function revalidateDashboardPath() {
  revalidatePath('/dashboard')
}

export async function revalidateJobsPath() {
  revalidatePath('/dashboard/jobs')
}

export async function revalidateEstimatesPath() {
  revalidatePath('/dashboard/estimates')
}
