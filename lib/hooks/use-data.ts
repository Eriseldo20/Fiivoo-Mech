'use client'

import useSWR, { SWRConfiguration } from 'swr'
import { createClient } from '@/lib/supabase/client'

// Default SWR configuration for optimal caching
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // 5 seconds
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  keepPreviousData: true, // Show stale data while revalidating
}

// Generic fetcher for Supabase queries
async function supabaseFetcher<T>(
  key: string,
  query: () => Promise<{ data: T | null; error: Error | null }>
): Promise<T> {
  const { data, error } = await query()
  if (error) throw error
  return data as T
}

// Hook for fetching jobs with SWR
export function useJobs(shopId: string | null) {
  return useSWR(
    shopId ? ['jobs', shopId] : null,
    async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          *,
          vehicle:vehicles(id, make, model, license_plate, year),
          customer:customers(id, name, phone),
          assignee:profiles(id, first_name, last_name)
        `)
        .eq('shop_id', shopId!)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    {
      ...swrConfig,
      revalidateOnMount: true,
    }
  )
}

// Hook for fetching estimates with SWR
export function useEstimates(shopId: string | null) {
  return useSWR(
    shopId ? ['estimates', shopId] : null,
    async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('estimates')
        .select(`
          *,
          vehicle:vehicles(make, model, license_plate, year),
          customer:customers(name, email, phone)
        `)
        .eq('shop_id', shopId!)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    swrConfig
  )
}

// Hook for fetching customers with SWR
export function useCustomers(shopId: string | null) {
  return useSWR(
    shopId ? ['customers', shopId] : null,
    async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId!)
        .order('name')
      
      if (error) throw error
      return data
    },
    {
      ...swrConfig,
      dedupingInterval: 30000, // 30 seconds for less frequently changing data
    }
  )
}

// Hook for fetching vehicles with SWR
export function useVehicles(shopId: string | null) {
  return useSWR(
    shopId ? ['vehicles', shopId] : null,
    async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          customer:customers(id, name, phone)
        `)
        .eq('shop_id', shopId!)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    swrConfig
  )
}

// Hook for fetching inventory with SWR
export function useInventory(shopId: string | null) {
  return useSWR(
    shopId ? ['inventory', shopId] : null,
    async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('shop_id', shopId!)
        .order('name')
      
      if (error) throw error
      return data
    },
    {
      ...swrConfig,
      dedupingInterval: 30000,
    }
  )
}

// Hook for fetching service reminders with SWR
export function useServiceReminders(shopId: string | null, options?: { upcoming?: boolean }) {
  return useSWR(
    shopId ? ['reminders', shopId, options?.upcoming] : null,
    async () => {
      const supabase = createClient()
      
      let query = supabase
        .from('service_reminders')
        .select(`
          *,
          vehicle:vehicles(make, model, license_plate, year),
          customer:customers(name, phone)
        `)
        .eq('shop_id', shopId!)
        .order('scheduled_date', { ascending: true })

      if (options?.upcoming) {
        const today = new Date().toISOString().split('T')[0]
        query = query.gte('scheduled_date', today).eq('status', 'scheduled')
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
    {
      ...swrConfig,
      refreshInterval: 60000, // Auto-refresh every minute for reminders
    }
  )
}

// Hook for fetching dashboard stats
export function useDashboardStats(shopId: string | null) {
  return useSWR(
    shopId ? ['dashboard-stats', shopId] : null,
    async () => {
      const supabase = createClient()
      
      const [jobsResult, estimatesResult, customersResult] = await Promise.all([
        supabase
          .from('job_cards')
          .select('id, status', { count: 'exact' })
          .eq('shop_id', shopId!),
        supabase
          .from('estimates')
          .select('id, status, total', { count: 'exact' })
          .eq('shop_id', shopId!),
        supabase
          .from('customers')
          .select('id', { count: 'exact' })
          .eq('shop_id', shopId!),
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
    },
    {
      ...swrConfig,
      refreshInterval: 30000, // Auto-refresh every 30 seconds
    }
  )
}

// Hook for fetching upcoming reminders (for notifications)
export function useUpcomingReminders(shopId: string | null, daysAhead = 14) {
  return useSWR(
    shopId ? ['upcoming-reminders', shopId, daysAhead] : null,
    async () => {
      const supabase = createClient()
      
      const today = new Date()
      const futureDate = new Date(today)
      futureDate.setDate(today.getDate() + daysAhead)
      
      const { data, error } = await supabase
        .from('service_reminders')
        .select(`
          *,
          vehicle:vehicles(make, model, license_plate),
          customer:customers(name, phone)
        `)
        .eq('shop_id', shopId!)
        .in('status', ['scheduled', 'notified', 'overdue'])
        .lte('scheduled_date', futureDate.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
      
      if (error) throw error
      return data
    },
    {
      ...swrConfig,
      refreshInterval: 60000, // Auto-refresh every minute
    }
  )
}

// Hook for fetching low stock inventory items
export function useLowStockItems(shopId: string | null) {
  return useSWR(
    shopId ? ['low-stock', shopId] : null,
    async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, sku, category, quantity, min_quantity, location')
        .eq('shop_id', shopId!)
        .order('quantity', { ascending: true })
      
      if (error) throw error
      
      // Filter items where quantity <= min_quantity
      return (data || []).filter(item => item.quantity <= item.min_quantity)
    },
    {
      ...swrConfig,
      refreshInterval: 60000, // Auto-refresh every minute
      dedupingInterval: 30000,
    }
  )
}
