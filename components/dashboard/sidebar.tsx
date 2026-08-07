'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Car,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  Package,
  Calendar,
  BarChart3,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

import type { UserRole } from '@/lib/auth/roles'

type NavItemDef = {
  key: string
  href: string
  icon: React.ElementType
  ownerOnly?: boolean
}

const mainNavItems: NavItemDef[] = [
  { key: 'dashboard',  href: '/dashboard',            icon: LayoutDashboard },
  { key: 'jobCards',   href: '/dashboard/jobs',        icon: ClipboardList },
  { key: 'estimates',  href: '/dashboard/estimates',   icon: FileText, ownerOnly: true },
  { key: 'calendar',   href: '/dashboard/calendar',    icon: Calendar },
  { key: 'analytics',  href: '/dashboard/analytics',   icon: BarChart3, ownerOnly: true },
]

const fleetNavItems: NavItemDef[] = [
  { key: 'vehicles',   href: '/dashboard/vehicles',    icon: Car },
  { key: 'employees',  href: '/dashboard/employees',   icon: Users },
  { key: 'inventory',  href: '/dashboard/inventory',   icon: Package, ownerOnly: true },
  { key: 'suppliers',  href: '/dashboard/suppliers',   icon: Building2, ownerOnly: true },
]

const bottomNavItems: NavItemDef[] = [
  { key: 'settings',   href: '/dashboard/settings',    icon: Settings, ownerOnly: true },
]

interface SidebarProps {
  shopName: string
  role: UserRole
}

function NavItem({
  item,
  isActive,
  collapsed,
  label,
}: {
  item: { href: string; icon: React.ElementType }
  isActive: boolean
  collapsed: boolean
  label: string
}) {
  return (
    <Link
      href={item.href}
      prefetch={true}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-150',
        isActive
          ? 'text-white shadow-md'
          : 'text-sidebar-muted hover:text-white/90 hover:bg-white/[0.06]'
      )}
      style={isActive ? {
        background: 'linear-gradient(90deg, oklch(0.55 0.20 264 / 0.40) 0%, oklch(0.55 0.20 264 / 0.10) 100%)',
        boxShadow: '0 0 18px oklch(0.55 0.20 264 / 0.30), inset 0 1px 0 oklch(1 0 0 / 0.08)',
      } : undefined}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-none"
          style={{ background: 'linear-gradient(180deg, oklch(0.72 0.17 264) 0%, oklch(0.52 0.22 266) 100%)' }}
        />
      )}
      <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'drop-shadow-[0_0_6px_oklch(0.65_0.20_264/0.85)]')} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return <div className="my-1 border-t border-white/[0.07]" />
  }
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25 select-none">
      {label}
    </p>
  )
}

export function Sidebar({ shopName, role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const [collapsed, setCollapsed] = useState(false)

  const allow = (item: NavItemDef) => role === 'owner' || !item.ownerOnly
  const mainItems = mainNavItems.filter(allow)
  const fleetItems = fleetNavItems.filter(allow)
  const bottomItems = bottomNavItems.filter(allow)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname.startsWith(href)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col hidden md:flex',
        'border-r border-sidebar-border/50 transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
      style={{
        background: 'linear-gradient(165deg, oklch(0.13 0.03 260) 0%, oklch(0.09 0.025 258) 45%, oklch(0.06 0.015 255) 100%)',
        boxShadow: '4px 0 36px oklch(0 0 0 / 0.55), 2px 0 8px oklch(0 0 0 / 0.30), inset -1px 0 0 oklch(0.30 0.04 260 / 0.20)',
      }}
    >
      {/* ── Logo / Brand ── */}
      <div className={cn(
        'h-16 flex items-center border-b border-white/[0.07] flex-shrink-0',
        collapsed ? 'justify-center px-0' : 'justify-between px-4'
      )}
        style={{ background: 'linear-gradient(180deg, oklch(0.16 0.035 262 / 0.7) 0%, transparent 100%)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          {collapsed ? (
            <Image
              src="/brand/fiivoo-icon.png"
              alt="Fiivoo"
              width={36}
              height={36}
              className="flex-shrink-0 h-9 w-9 rounded-lg object-cover"
              priority
            />
          ) : (
            <div className="flex flex-col min-w-0 gap-0.5">
              <Image
                src="/brand/fiivoo-logo-white.png"
                alt="Fiivoo"
                width={160}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
              <span className="text-[11px] text-sidebar-muted truncate max-w-[150px] leading-tight pl-0.5">
                {shopName}
              </span>
            </div>
          )}
        </Link>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="h-6 w-6 rounded-md flex items-center justify-center text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors flex-shrink-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 h-6 w-6 rounded-md flex items-center justify-center text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {/* Main */}
        {!collapsed && <SectionLabel label="Main" collapsed={collapsed} />}
        {mainItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
            label={t(item.key)}
          />
        ))}

        {/* Fleet */}
        <SectionLabel label="Fleet & Stock" collapsed={collapsed} />
        {fleetItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
            label={t(item.key)}
          />
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div
        className="flex-shrink-0 border-t border-white/[0.07] px-3 py-3 space-y-0.5"
        style={{ background: 'linear-gradient(0deg, oklch(0.10 0.01 245 / 0.8) 0%, transparent 100%)' }}
      >
        {bottomItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
            label={t(item.key)}
          />
        ))}

        <button
          onClick={handleSignOut}
          title={collapsed ? t('signOut') : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-150',
            'text-sidebar-muted hover:text-red-400 hover:bg-red-500/10',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>{t('signOut')}</span>}
        </button>
      </div>
    </aside>
  )
}
