'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AgingBucket, ReceivablesAging } from '@/lib/data/analytics-queries'

interface ReceivablesCardProps {
  data: ReceivablesAging
}

/** Bucket order drives both the summary strip and the filter row. */
const BUCKET_ORDER: AgingBucket[] = ['current', 'thirty', 'sixty', 'ninety', 'year']

/**
 * Escalating severity. Only the two worst buckets get colour so a long-overdue
 * debt stands out instead of competing with everything else on the page.
 */
const BUCKET_STYLES: Record<AgingBucket, string> = {
  current: 'bg-muted text-foreground border-border',
  thirty: 'bg-muted text-foreground border-border',
  sixty: 'bg-amber-100 text-amber-900 border-amber-300',
  ninety: 'bg-orange-100 text-orange-900 border-orange-300',
  year: 'bg-red-600 text-white border-red-600',
}

export function ReceivablesCard({ data }: ReceivablesCardProps) {
  const t = useTranslations('receivables')
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [bucketFilter, setBucketFilter] = useState<AgingBucket | 'all'>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [settling, setSettling] = useState<string | null>(null)

  const bucketLabel = (b: AgingBucket) => t(`bucket.${b}`)

  const toggleRow = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  /**
   * Mark a single invoice settled. The estimate is the source of truth for
   * payment, so this mirrors PaymentStatusControl rather than inventing a
   * second write path.
   */
  const markPaid = async (estimateId: string) => {
    setSettling(estimateId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('estimates')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', estimateId)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Failed to mark invoice paid:', err)
    } finally {
      setSettling(null)
    }
  }

  const customers = useMemo(() => {
    const term = query.trim().toLowerCase()
    return data.customers
      .map((c) => ({
        ...c,
        invoices:
          bucketFilter === 'all' ? c.invoices : c.invoices.filter((i) => i.bucket === bucketFilter),
      }))
      // Filtering by bucket can empty a customer out entirely; drop them.
      .filter((c) => c.invoices.length > 0)
      .filter((c) => {
        if (!term) return true
        return (
          c.name.toLowerCase().includes(term) ||
          (c.phone ?? '').toLowerCase().includes(term) ||
          (c.email ?? '').toLowerCase().includes(term) ||
          c.invoices.some((i) => i.estimateNumber.toLowerCase().includes(term))
        )
      })
      .map((c) => ({
        ...c,
        // Recompute so the visible total always matches the visible rows.
        totalOwed: c.invoices.reduce((s, i) => s + i.total, 0),
        invoiceCount: c.invoices.length,
      }))
  }, [data.customers, query, bucketFilter])

  const visibleTotal = customers.reduce((s, c) => s + c.totalOwed, 0)
  const isFiltered = bucketFilter !== 'all' || query.trim() !== ''

  /** Debt at or beyond 90 days - the number that actually needs chasing. */
  const seriouslyOverdue = data.buckets.ninety.total + data.buckets.year.total

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const ageLabel = (days: number) => {
    if (days >= 365) {
      const years = Math.floor(days / 365)
      return t('ageYears', { count: years })
    }
    if (days >= 60) return t('ageMonths', { count: Math.floor(days / 30) })
    return t('ageDays', { count: days })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t('openReport')}
          className={cn(
            'w-full text-left rounded-none border p-5 transition-colors',
            'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            seriouslyOverdue > 0 ? 'border-red-300 bg-red-50/60' : 'border-border',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={cn(
                    'h-4 w-4 shrink-0',
                    seriouslyOverdue > 0 ? 'text-red-600' : 'text-muted-foreground',
                  )}
                />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {t('title')}
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tabular-nums">
                {formatCurrency(data.totalOwed)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('summaryLine', {
                  customers: data.customerCount,
                  invoices: data.invoiceCount,
                })}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          </div>

          {data.invoiceCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
              {BUCKET_ORDER.filter((b) => data.buckets[b].count > 0).map((b) => (
                <span
                  key={b}
                  className={cn(
                    'inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-medium',
                    BUCKET_STYLES[b],
                  )}
                >
                  {bucketLabel(b)}
                  <span className="tabular-nums">{formatCurrency(data.buckets[b].total)}</span>
                </span>
              ))}
            </div>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] sm:max-w-5xl rounded-none max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('dialogDescription')}</DialogDescription>
        </DialogHeader>

        {data.invoiceCount === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">{t('emptyAll')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Aging strip: total owed per bucket, doubles as a filter. */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {BUCKET_ORDER.map((b) => {
                const active = bucketFilter === b
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBucketFilter(active ? 'all' : b)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-none border p-3 text-left transition-colors',
                      'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active ? 'border-foreground bg-muted' : 'border-border',
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground">{bucketLabel(b)}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {formatCurrency(data.buckets[b].total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('invoiceCount', { count: data.buckets[b].count })}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="rounded-none pl-9"
                aria-label={t('searchPlaceholder')}
              />
            </div>

            <div className="border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>{t('customer')}</TableHead>
                    <TableHead>{t('contact')}</TableHead>
                    <TableHead className="text-center">{t('invoices')}</TableHead>
                    <TableHead>{t('oldestDebt')}</TableHead>
                    <TableHead className="text-right">{t('owed')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        {t('emptyFiltered')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((c) => {
                      const isOpen = expanded.has(c.customerId)
                      return (
                        <Fragment key={c.customerId}>
                          <TableRow
                            className="cursor-pointer"
                            onClick={() => toggleRow(c.customerId)}
                          >
                            <TableCell>
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                                {c.phone && (
                                  <a
                                    href={`tel:${c.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                                  >
                                    <Phone className="h-3 w-3" />
                                    {c.phone}
                                  </a>
                                )}
                                {c.email && (
                                  <a
                                    href={`mailto:${c.email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                                  >
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[180px]">{c.email}</span>
                                  </a>
                                )}
                                {!c.phone && !c.email && <span>{t('noContact')}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {c.invoiceCount}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  'inline-flex items-center border px-2 py-0.5 text-xs font-medium',
                                  BUCKET_STYLES[c.worstBucket],
                                )}
                              >
                                {ageLabel(c.oldestDays)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {formatCurrency(c.totalOwed)}
                            </TableCell>
                          </TableRow>

                          {isOpen && (
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell />
                              <TableCell colSpan={5} className="py-3">
                                <div className="space-y-2">
                                  {c.invoices.map((inv) => (
                                    <div
                                      key={inv.id}
                                      className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background px-3 py-2"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">
                                            {inv.estimateNumber || t('noNumber')}
                                          </span>
                                          <span
                                            className={cn(
                                              'inline-flex items-center border px-1.5 py-0.5 text-[11px] font-medium',
                                              BUCKET_STYLES[inv.bucket],
                                            )}
                                          >
                                            {ageLabel(inv.daysOverdue)}
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {formatDate(inv.createdAt)}
                                          {inv.vehicle ? ` • ${inv.vehicle}` : ''}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold tabular-nums text-sm">
                                          {formatCurrency(inv.total)}
                                        </span>
                                        <Button
                                          asChild
                                          size="sm"
                                          variant="outline"
                                          className="rounded-none h-8"
                                        >
                                          <Link href={`/dashboard/estimates/${inv.id}`}>
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            <span className="sr-only sm:not-sr-only sm:ml-1.5">
                                              {t('view')}
                                            </span>
                                          </Link>
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => markPaid(inv.id)}
                                          disabled={settling === inv.id}
                                          className="rounded-none h-8"
                                        >
                                          {settling === inv.id && (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                          )}
                                          {t('markPaid')}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">
                {isFiltered ? t('filteredTotal') : t('grandTotal')}
              </span>
              <span className="text-lg font-bold tabular-nums">
                {formatCurrency(visibleTotal)}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
