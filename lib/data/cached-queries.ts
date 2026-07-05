import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeSearchTerm } from '@/lib/search'

// Cache tags for invalidation (used with revalidateTag)
export const CACHE_TAGS = {
  JOBS: 'jobs',
  ESTIMATES: 'estimates',
  CUSTOMERS: 'customers',
  VEHICLES: 'vehicles',
  INVENTORY: 'inventory',
  EMPLOYEES: 'employees',
  REMINDERS: 'reminders',
  DASHBOARD: 'dashboard',
} as const

// Revalidation times (in seconds)
export const REVALIDATE_TIMES = {
  SHORT: 30,      // 30 seconds - for frequently changing data
  MEDIUM: 60,     // 1 minute - for moderately changing data
  LONG: 300,      // 5 minutes - for slowly changing data
  STATIC: 3600,   // 1 hour - for rarely changing data
} as const

/**
 * NOTE ON CACHING STRATEGY
 * ------------------------
 * Next.js Data Cache (unstable_cache) cannot read cookies, so the cached
 * reads below use the service-role admin client and are ALWAYS scoped by
 * `shopId`. Callers must verify the authenticated user belongs to that shop
 * before calling (every dashboard page does this).
 *
 * We cache the *base, unfiltered* dataset per shop so repeated navigations
 * reliably produce cache HITs, then apply any status/priority/search filters
 * in memory. Mutations invalidate via `revalidateTag(...)` (see
 * lib/actions/revalidate.ts).
 */

// ---------------------------------------------------------------------------
// Dashboard stats - cached, single-pass aggregation
// ---------------------------------------------------------------------------
export function getDashboardStats(shopId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()

      const now = new Date()
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

      const [jobsResult, estimatesResult, customersResult, lastMonthJobsResult, lastMonthCustomersResult] =
        await Promise.all([
          supabase.from('job_cards').select('id, status', { count: 'exact' }).eq('shop_id', shopId),
          supabase.from('estimates').select('id, status, total', { count: 'exact' }).eq('shop_id', shopId),
          supabase.from('customers').select('id', { count: 'exact' }).eq('shop_id', shopId),
          supabase
            .from('job_cards')
            .select('id, status')
            .eq('shop_id', shopId)
            .gte('created_at', startOfLastMonth)
            .lte('created_at', endOfLastMonth),
          supabase
            .from('customers')
            .select('id', { count: 'exact' })
            .eq('shop_id', shopId)
            .lte('created_at', endOfLastMonth),
        ])

      const jobs = jobsResult.data || []
      const estimates = estimatesResult.data || []
      const lastMonthJobs = lastMonthJobsResult.data || []

      const activeJobs = jobs.filter((j) => j.status === 'in_progress' || j.status === 'pending').length
      const pendingEstimates = estimates.filter(
        (e) => e.status === 'draft' || e.status === 'sent' || e.status === 'pending',
      ).length
      const totalCustomers = customersResult.count || 0
      const approvedRevenue = estimates
        .filter((e) => e.status === 'approved')
        .reduce((sum, e) => sum + (e.total || 0), 0)

      const lastMonthActiveJobs = lastMonthJobs.filter(
        (j) => j.status === 'in_progress' || j.status === 'pending',
      ).length
      const lastMonthCustomers = lastMonthCustomersResult.count || 0

      const calcChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
      }

      return {
        activeJobs,
        pendingEstimates,
        totalCustomers,
        approvedRevenue,
        changes: {
          activeJobs: calcChange(activeJobs, lastMonthActiveJobs),
          totalCustomers: calcChange(totalCustomers, lastMonthCustomers),
        },
      }
    },
    ['dashboard-stats', shopId],
    { tags: [CACHE_TAGS.DASHBOARD], revalidate: REVALIDATE_TIMES.SHORT },
  )()
}

// ---------------------------------------------------------------------------
// Recent jobs - cached
// ---------------------------------------------------------------------------
export function getRecentJobs(shopId: string, limit = 5) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('job_cards')
        .select(
          `
          id, job_number, title, status, priority, created_at,
          vehicle:vehicles(make, model, license_plate),
          customer:customers(name)
        `,
        )
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(limit)

      return data || []
    },
    ['recent-jobs', shopId, String(limit)],
    { tags: [CACHE_TAGS.JOBS, CACHE_TAGS.DASHBOARD], revalidate: REVALIDATE_TIMES.SHORT },
  )()
}

// ---------------------------------------------------------------------------
// Jobs - cached base list (all jobs for a shop). Filter in memory.
// ---------------------------------------------------------------------------
export function getAllJobs(shopId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('job_cards')
        .select(
          `
          *,
          vehicle:vehicles(id, make, model, license_plate, year),
          customer:customers(id, name, phone),
          assignee:profiles(id, first_name, last_name)
        `,
        )
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

      return data || []
    },
    ['jobs-all', shopId],
    { tags: [CACHE_TAGS.JOBS], revalidate: REVALIDATE_TIMES.MEDIUM },
  )()
}

// Jobs list with filters (applied in memory on the cached base list)
export async function getJobs(
  shopId: string,
  filters?: { status?: string; priority?: string; search?: string },
) {
  const all = await getAllJobs(shopId)
  let jobs = all as Array<Record<string, unknown>>

  if (filters?.status && filters.status !== 'all') {
    jobs = jobs.filter((j) => j.status === filters.status)
  }
  if (filters?.priority && filters.priority !== 'all') {
    jobs = jobs.filter((j) => j.priority === filters.priority)
  }
  if (filters?.search) {
    const term = sanitizeSearchTerm(filters.search)?.toLowerCase()
    if (term) {
      jobs = jobs.filter(
        (j) =>
          String(j.title ?? '').toLowerCase().includes(term) ||
          String(j.job_number ?? '').toLowerCase().includes(term),
      )
    }
  }

  return jobs
}

// ---------------------------------------------------------------------------
// Estimates - cached base list. Filter in memory.
// ---------------------------------------------------------------------------
export function getAllEstimates(shopId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('estimates')
        .select(
          `
          *,
          vehicle:vehicles(id, make, model, license_plate, year),
          customer:customers(id, name, email, phone)
        `,
        )
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

      return data || []
    },
    ['estimates-all', shopId],
    { tags: [CACHE_TAGS.ESTIMATES], revalidate: REVALIDATE_TIMES.MEDIUM },
  )()
}

export async function getEstimates(shopId: string, filters?: { status?: string; search?: string }) {
  const all = await getAllEstimates(shopId)
  let estimates = all as Array<Record<string, unknown>>

  if (filters?.status && filters.status !== 'all') {
    estimates = estimates.filter((e) => e.status === filters.status)
  }
  if (filters?.search) {
    const term = filters.search.toLowerCase()
    estimates = estimates.filter(
      (e) =>
        String(e.estimate_number ?? '').toLowerCase().includes(term) ||
        String(e.notes ?? '').toLowerCase().includes(term),
    )
  }

  return estimates
}

// ---------------------------------------------------------------------------
// Customers - cached
// ---------------------------------------------------------------------------
export function getCustomers(shopId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('customers')
        .select('id, name, email, phone')
        .eq('shop_id', shopId)
        .order('name')

      return data || []
    },
    ['customers-all', shopId],
    { tags: [CACHE_TAGS.CUSTOMERS], revalidate: REVALIDATE_TIMES.MEDIUM },
  )()
}

// ---------------------------------------------------------------------------
// Vehicles - cached
// ---------------------------------------------------------------------------
export function getVehicles(shopId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('vehicles')
        .select(
          `
          id, make, model, year, license_plate, vin,
          customer:customers(id, name, phone)
        `,
        )
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

      return data || []
    },
    ['vehicles-all', shopId],
    { tags: [CACHE_TAGS.VEHICLES], revalidate: REVALIDATE_TIMES.MEDIUM },
  )()
}

// ---------------------------------------------------------------------------
// Inventory - cached
// ---------------------------------------------------------------------------
export function getInventory(shopId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase.from('inventory').select('*').eq('shop_id', shopId).order('name')
      return data || []
    },
    ['inventory-all', shopId],
    { tags: [CACHE_TAGS.INVENTORY], revalidate: REVALIDATE_TIMES.MEDIUM },
  )()
}

// ---------------------------------------------------------------------------
// Service reminders - cached base list. Apply options in memory.
// ---------------------------------------------------------------------------
export function getAllServiceReminders(shopId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('service_reminders')
        .select(
          `
          *,
          vehicle:vehicles(make, model, license_plate, year),
          customer:customers(name, phone)
        `,
        )
        .eq('shop_id', shopId)
        .order('scheduled_date', { ascending: true })

      return data || []
    },
    ['reminders-all', shopId],
    { tags: [CACHE_TAGS.REMINDERS], revalidate: REVALIDATE_TIMES.MEDIUM },
  )()
}

export async function getServiceReminders(
  shopId: string,
  options?: { upcoming?: boolean; limit?: number },
) {
  const all = await getAllServiceReminders(shopId)
  let reminders = all as Array<Record<string, unknown>>

  if (options?.upcoming) {
    const today = new Date().toISOString().split('T')[0]
    reminders = reminders.filter(
      (r) => r.status === 'scheduled' && String(r.scheduled_date ?? '') >= today,
    )
  }
  if (options?.limit) {
    reminders = reminders.slice(0, options.limit)
  }

  return reminders
}

// ---------------------------------------------------------------------------
// Per-user profile lookups. NOT cached (auth-scoped, must stay fresh so role
// / shop changes take effect immediately). Uses the cookie-based RLS client.
// ---------------------------------------------------------------------------
export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*, shops(*)').eq('id', userId).single()
  return data
}

export async function getShopId(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('shop_id').eq('id', userId).single()
  return data?.shop_id
}
