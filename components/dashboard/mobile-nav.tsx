'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Car,
  Users,
  Package,
  Settings,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/auth/roles'

const navItems = [
  {
    key: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'jobs',
    href: '/dashboard/jobs',
    icon: ClipboardList,
  },
  {
    key: 'estimates',
    href: '/dashboard/estimates',
    icon: FileText,
    ownerOnly: true,
  },
  {
    key: 'calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
  },
  {
    key: 'analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    ownerOnly: true,
  },
  {
    key: 'settings',
    href: '/dashboard/settings',
    icon: Settings,
    ownerOnly: true,
  },
]

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const items = navItems.filter((item) => role === 'owner' || !item.ownerOnly)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-sidebar border-t border-sidebar-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px]',
                isActive
                  ? 'text-sidebar-primary bg-sidebar-primary/10'
                  : 'text-sidebar-muted active:bg-sidebar-accent'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5',
                isActive && 'text-sidebar-primary'
              )} />
              <span className={cn(
                'text-[10px] font-medium truncate max-w-[56px]',
                isActive ? 'text-sidebar-primary' : 'text-sidebar-muted'
              )}>
                {t(item.key)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
