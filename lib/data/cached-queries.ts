import { createClient } from '@/lib/supabase/server'

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

// Dashboard stats - optimized with single query aggregation
export async function getDashboardStats(shopId: string) {
  const supabase = await createClient()
  
  const [jobsResult, estimatesResult, customersResult] = await Promise.all([
    supabase
      .from('job_cards')
      .select('id, status', { count: 'exact' })
      .eq('shop_id', shopId),
    supabase
      .from('estimates')
      .select('id, status, total', { count: 'exact' })
      .eq('shop_id', shopId),
    supabase
      .from('customers')
      .select('id', { count: 'exact' })
      .eq('shop_id', shopId),
  ])

  const jobs = jobsResult.data || []
  const estimates = estimatesResult.data || []
  
  return {
    activeJobs: jobs.filter(j => j.status === 'in_progress' || j.status === 'pending').length,
    pendingEstimates: estimates.filter(e => e.status === 'draft' || e.status === 'sent').length,
    totalCustomers: customersResult.count || 0,
    approvedRevenue: estimates
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + (e.total || 0), 0),
  }
}

// Recent jobs with optimized select
export async function getRecentJobs(shopId: string, limit = 5) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('job_cards')
    .select(`
      id, job_number, title, status, priority, created_at,
      vehicle:vehicles(make, model, license_plate),
      customer:customers(name)
    `)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return data || []
}

// Jobs list with filters
export async function getJobs(shopId: string, filters?: { status?: string; priority?: string; search?: string }) {
  const supabase = await createClient()
  
  let query = supabase
    .from('job_cards')
    .select(`
      *,
      vehicle:vehicles(id, make, model, license_plate, year),
      customer:customers(id, name, phone),
      assignee:profiles(id, first_name, last_name)
    `)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,job_number.ilike.%${filters.search}%`)
  }

  const { data } = await query
  return data || []
}

// Estimates list with filters
export async function getEstimates(shopId: string, filters?: { status?: string; search?: string }) {
  const supabase = await createClient()
  
  let query = supabase
    .from('estimates')
    .select(`
      *,
      vehicle:vehicles(make, model, license_plate, year),
      customer:customers(name, email, phone)
    `)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.or(`estimate_number.ilike.%${filters.search}%`)
  }

  const { data } = await query
  return data || []
}

// Customers list
export async function getCustomers(shopId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('customers')
    .select('id, name, email, phone')
    .eq('shop_id', shopId)
    .order('name')
  
  return data || []
}

// Vehicles list
export async function getVehicles(shopId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('vehicles')
    .select(`
      id, make, model, year, license_plate, vin,
      customer:customers(id, name, phone)
    `)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
  
  return data || []
}

// Inventory list
export async function getInventory(shopId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('inventory')
    .select('*')
    .eq('shop_id', shopId)
    .order('name')
  
  return data || []
}

// Service reminders
export async function getServiceReminders(shopId: string, options?: { upcoming?: boolean; limit?: number }) {
  const supabase = await createClient()
  
  let query = supabase
    .from('service_reminders')
    .select(`
      *,
      vehicle:vehicles(make, model, license_plate, year),
      customer:customers(name, phone)
    `)
    .eq('shop_id', shopId)
    .order('scheduled_date', { ascending: true })

  if (options?.upcoming) {
    const today = new Date().toISOString().split('T')[0]
    query = query.gte('scheduled_date', today).eq('status', 'scheduled')
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data } = await query
  return data || []
}

// Get user profile with shop
export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('profiles')
    .select('*, shops(*)')
    .eq('id', userId)
    .single()
  
  return data
}

// Get shop ID for current user
export async function getShopId(userId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', userId)
    .single()
  
  return data?.shop_id
}
