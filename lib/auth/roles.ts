import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'owner' | 'manager' | 'mechanic'

export type CurrentUser = {
  id: string
  email: string | null
  role: UserRole
  shopId: string
  shopName: string
  fullName: string | null
}

/**
 * Loads the authenticated user's profile + role.
 * Returns null when not authenticated or no profile row exists.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, shop_id, full_name, shops(name)')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const shop = profile.shops as { name: string } | null

  return {
    id: profile.id,
    email: user.email ?? null,
    role: (profile.role as UserRole) ?? 'mechanic',
    shopId: profile.shop_id as string,
    shopName: shop?.name ?? 'My Shop',
    fullName: (profile.full_name as string | null) ?? null,
  }
}

/** Only the owner can see money / financials. */
export function canSeePrices(role: UserRole): boolean {
  return role === 'owner'
}

/** Owner + manager operate the shop dashboard. Mechanics use the portal. */
export function canAccessDashboard(role: UserRole): boolean {
  return role === 'owner' || role === 'manager'
}

/** Sections a manager may NOT access (owner-only areas). */
export const OWNER_ONLY_SECTIONS = [
  '/dashboard/analytics',
  '/dashboard/invoices',
  '/dashboard/expenses',
  '/dashboard/settings',
] as const

export function canAccessSection(role: UserRole, pathname: string): boolean {
  if (role === 'owner') return true
  if (role === 'manager') {
    return !OWNER_ONLY_SECTIONS.some((s) => pathname.startsWith(s))
  }
  // mechanics don't use the dashboard at all
  return false
}

/**
 * Guard for dashboard server components/layouts.
 * - Redirects unauthenticated users to login.
 * - Redirects mechanics to their portal.
 * - Redirects users without a shop to onboarding.
 */
export async function requireDashboardUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  if (!user.shopId) redirect('/onboarding')
  if (!canAccessDashboard(user.role)) redirect('/portal')
  return user
}

/** Guard for the worker portal. Owners/managers are sent to the dashboard. */
export async function requirePortalUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  if (!user.shopId) redirect('/onboarding')
  return user
}
