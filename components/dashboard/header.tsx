'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface HeaderProps {
  title?: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function Header({ title, description, action }: HeaderProps) {
  const t = useTranslations()
  const pathname = usePathname()
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  // Get translated title based on current path
  const getTitle = () => {
    if (title) return title
    if (pathname === '/dashboard') return t('nav.dashboard')
    if (pathname.startsWith('/dashboard/jobs')) return t('nav.jobs')
    if (pathname.startsWith('/dashboard/estimates')) return t('nav.estimates')
    if (pathname.startsWith('/dashboard/vehicles')) return t('nav.vehicles')
    if (pathname.startsWith('/dashboard/employees')) return t('nav.employees')
    if (pathname.startsWith('/dashboard/inventory')) return t('nav.inventory')
    if (pathname.startsWith('/dashboard/calendar')) return t('nav.calendar')
    if (pathname.startsWith('/dashboard/settings')) return t('nav.settings')
    return t('nav.dashboard')
  }

  return (
    <header className="sticky top-0 z-30 bg-background/95 border-b border-border/50">
      <div className="h-14 md:h-16 px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4">
        {/* Left: Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-semibold truncate">{getTitle()}</h1>
          {description && (
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block truncate">{description}</p>
          )}
        </div>

        {/* Center: Search - Desktop */}
        <div className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              className="pl-10 h-10 bg-muted/50 border-border/50 focus:bg-background transition-colors"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

          {/* Action Button - Desktop */}
          {action && action.href && (
            <Link href={action.href} className="hidden sm:block">
              <Button size="sm" className="h-9 gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">{action.label}</span>
                <span className="lg:hidden">New</span>
              </Button>
            </Link>
          )}
          {action && action.onClick && (
            <Button size="sm" className="h-9 gap-2 hidden sm:flex" onClick={action.onClick}>
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">{action.label}</span>
              <span className="lg:hidden">New</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Search Dropdown */}
      {showMobileSearch && (
        <div className="md:hidden px-4 pb-3 bg-background/95 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              className="pl-10 h-10 bg-muted/50 border-border/50"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}
