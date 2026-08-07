import type { LucideIcon } from 'lucide-react'
import { Clock, Wrench, PackageSearch, CheckCircle2, ReceiptText } from 'lucide-react'

/**
 * Shared, high-contrast status styling for the employee portal.
 * `badge`   -> solid pill used on cards/headers
 * `accent`  -> left border + icon tint used to color a card by status
 * `soft`    -> tinted surface for status icon chips
 */
export type PortalStatusConfig = {
  key: string
  icon: LucideIcon
  badge: string
  accent: string
  soft: string
  dot: string
}

export const portalStatus: Record<string, PortalStatusConfig> = {
  pending: {
    key: 'pending',
    icon: Clock,
    badge: 'bg-amber-500 text-white',
    accent: 'border-l-amber-500',
    soft: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  in_progress: {
    key: 'inProgress',
    icon: Wrench,
    badge: 'bg-primary text-primary-foreground',
    accent: 'border-l-primary',
    soft: 'bg-primary/15 text-primary',
    dot: 'bg-primary',
  },
  awaiting_parts: {
    key: 'awaitingParts',
    icon: PackageSearch,
    badge: 'bg-orange-500 text-white',
    accent: 'border-l-orange-500',
    soft: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  completed: {
    key: 'completed',
    icon: CheckCircle2,
    badge: 'bg-emerald-600 text-white',
    accent: 'border-l-emerald-600',
    soft: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-600',
  },
  invoiced: {
    key: 'invoiced',
    icon: ReceiptText,
    badge: 'bg-blue-600 text-white',
    accent: 'border-l-blue-600',
    soft: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-600',
  },
}

export function getPortalStatus(status: string): PortalStatusConfig {
  return portalStatus[status] ?? portalStatus.pending
}
