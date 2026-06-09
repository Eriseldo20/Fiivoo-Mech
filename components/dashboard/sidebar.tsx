'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  Wrench,
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const mainNavItems = [
  { key: 'dashboard',  href: '/dashboard',            icon: LayoutDashboard },
  { key: 'jobCards',   href: '/dashboard/jobs',        icon: ClipboardList },
  { key: 'estimates',  href: '/dashboard/estimates',   icon: FileText },
  { key: 'calendar',   href: '/dashboard/calendar',    icon: Calendar },
]

const fleetNavItems = [
  { key: 'vehicles',   href: '/dashboard/vehicles',    icon: Car },
  { key: 'employees',  href: '/dashboard/employees',   icon: Users },
  { key: 'inventory',  href: '/dashboard/inventory',   icon: Package },
]

const bottomNavItems = [
  { key: 'settings',   href: '/dashboard/settings',    icon: Settings },
]

interface SidebarProps {
  shopName: string
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
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        isActive
          ? 'text-white shadow-md'
          : 'text-sidebar-muted hover:text-white/90 hover:bg-white/[0.06]'
      )}
      style={isActive ? {
        background: 'linear-gradient(90deg, oklch(0.65 0.15 195 / 0.30) 0%, oklch(0.65 0.15 195 / 0.12) 100%)',
        boxShadow: '0 0 16px oklch(0.65 0.15 195 / 0.20), inset 0 1px 0 oklch(1 0 0 / 0.08)',
      } : undefined}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{ background: 'linear-gradient(180deg, oklch(0.80 0.12 195) 0%, oklch(0.60 0.18 195) 100%)' }}
        />
      )}
      <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'drop-shadow-[0_0_6px_oklch(0.75_0.15_195/0.8)]')} />
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

export function Sidebar({ shopName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const [collapsed, setCollapsed] = useState(false)

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
        background: 'linear-gradient(160deg, oklch(0.17 0.02 255) 0%, oklch(0.12 0.015 250) 50%, oklch(0.10 0.01 245) 100%)',
        boxShadow: '4px 0 32px oklch(0 0 0 / 0.45), 2px 0 8px oklch(0 0 0 / 0.25), inset -1px 0 0 oklch(0.30 0.02 250 / 0.25)',
      }}
    >
      {/* ── Logo / Brand ── */}
      <div className={cn(
        'h-16 flex items-center border-b border-white/[0.07] flex-shrink-0',
        collapsed ? 'justify-center px-0' : 'justify-between px-4'
      )}
        style={{ background: 'linear-gradient(180deg, oklch(0.19 0.02 255 / 0.6) 0%, transparent 100%)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-sm">
            <Wrench className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-sidebar-foreground tracking-tight leading-tight">
                Fiivoo Mech
              </span>
              <span className="text-[11px] text-sidebar-muted truncate max-w-[130px] leading-tight">
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
        {mainNavItems.map((item) => (
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
        {fleetNavItems.map((item) => (
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
        {bottomNavItems.map((item) => (
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
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
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
