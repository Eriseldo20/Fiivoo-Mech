'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { CACHE_TAGS } from '@/lib/data/cached-queries'

// Revalidate specific cache tags
export async function revalidateJobs() {
  revalidateTag(CACHE_TAGS.JOBS)
  revalidateTag(CACHE_TAGS.DASHBOARD)
}

export async function revalidateEstimates() {
  revalidateTag(CACHE_TAGS.ESTIMATES)
  revalidateTag(CACHE_TAGS.DASHBOARD)
}

export async function revalidateCustomers() {
  revalidateTag(CACHE_TAGS.CUSTOMERS)
  revalidateTag(CACHE_TAGS.DASHBOARD)
}

export async function revalidateVehicles() {
  revalidateTag(CACHE_TAGS.VEHICLES)
}

export async function revalidateInventory() {
  revalidateTag(CACHE_TAGS.INVENTORY)
}

export async function revalidateReminders() {
  revalidateTag(CACHE_TAGS.REMINDERS)
}

export async function revalidateDashboard() {
  revalidateTag(CACHE_TAGS.DASHBOARD)
}

// Revalidate all caches
export async function revalidateAll() {
  Object.values(CACHE_TAGS).forEach(tag => {
    revalidateTag(tag)
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
