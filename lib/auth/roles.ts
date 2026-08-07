import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_EUR_TO_ALL, toCurrencyCode, type CurrencyCode } from '@/lib/currency'

export type UserRole = 'owner' | 'manager' | 'mechanic'

export type CurrentUser = {
  id: string
  email: string | null
  role: UserRole
  shopId: string
  shopName: string
  fullName: string | null
  /** Currency the shop reads its figures in. */
  currency: CurrencyCode
  /** Shop default EUR -> ALL rate, used for new documents and conversions. */
  eurToAllRate: number
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
    .select('id, role, shop_id, first_name, last_name, shops(name, currency, eur_to_all_rate)')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const shop = profile.shops as unknown as {
    name: string
    currency: string | null
    eur_to_all_rate: number | string | null
  } | null

  // A missing/zero rate would break conversion, so fall back to the default.
  const parsedRate = Number(shop?.eur_to_all_rate)
  const eurToAllRate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : DEFAULT_EUR_TO_ALL
  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || null

  return {
    id: profile.id,
    email: user.email ?? null,
    role: (profile.role as UserRole) ?? 'mechanic',
    shopId: profile.shop_id as string,
    shopName: shop?.name ?? 'My Shop',
    fullName,
    currency: toCurrencyCode(shop?.currency),
    eurToAllRate,
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
  '/dashboard/suppliers',
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
