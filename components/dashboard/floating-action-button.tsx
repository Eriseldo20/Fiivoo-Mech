'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, X, ClipboardList, FileText, Car, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export function FloatingActionButton() {
  const t = useTranslations('dashboard')
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    {
      label: t('newJobCard'),
      href: '/dashboard/jobs/new',
      icon: ClipboardList,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      label: t('newEstimate'),
      href: '/dashboard/estimates/new',
      icon: FileText,
      color: 'bg-amber-500 hover:bg-amber-600',
    },
    {
      label: t('addVehicle'),
      href: '/dashboard/vehicles',
      icon: Car,
      color: 'bg-emerald-500 hover:bg-emerald-600',
    },
  ]

  return (
    <div className="md:hidden fixed right-4 bottom-20 z-50">
      {/* Action items */}
      <div className={cn(
        'absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-200',
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}>
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3"
          >
            <span className="bg-card border border-border/50 shadow-lg rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap">
              {action.label}
            </span>
            <div className={cn(
              'w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105',
              action.color
            )}>
              <action.icon className="h-5 w-5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200',
          isOpen ? 'bg-muted-foreground rotate-45' : 'bg-primary hover:bg-primary/90'
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
