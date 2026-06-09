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

const navItems = [
  {
    key: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'jobCards',
    href: '/dashboard/jobs',
    icon: ClipboardList,
  },
  {
    key: 'estimates',
    href: '/dashboard/estimates',
    icon: FileText,
  },
  {
    key: 'vehicles',
    href: '/dashboard/vehicles',
    icon: Car,
  },
  {
    key: 'employees',
    href: '/dashboard/employees',
    icon: Users,
  },
  {
    key: 'inventory',
    href: '/dashboard/inventory',
    icon: Package,
  },
  {
    key: 'calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
  },
  {
    key: 'settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

interface SidebarProps {
  shopName: string
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

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-col hidden md:flex',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sidebar-primary/10 border border-sidebar-primary/20 flex-shrink-0">
            <Wrench className="h-5 w-5 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-foreground">Fiivoo Mech</span>
              <span className="text-xs text-sidebar-muted truncate max-w-[140px]">
                {shopName}
              </span>
            </div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/20'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
              {!collapsed && <span>{t(item.key)}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed && 'justify-center px-0'
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>{t('signOut')}</span>}
        </Button>
      </div>
    </aside>
  )
}
