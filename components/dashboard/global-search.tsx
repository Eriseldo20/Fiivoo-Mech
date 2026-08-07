'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Briefcase, FileText, Loader2, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/components/providers/currency-provider'
import { toCurrencyCode } from '@/lib/currency'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

interface JobResult {
  id: string
  job_number: string | null
  title: string | null
  status: string | null
}

interface EstimateResult {
  id: string
  estimate_number: string | null
  status: string | null
  total: number | null
  /** The currency this estimate was written in; it displays verbatim. */
  currency: string | null
  customer: { name: string | null } | null
}

// Strip characters that would break a PostgREST `.or(...)` ilike filter
function sanitize(term: string) {
  return term.replace(/[%,()]/g, ' ').trim()
}

const OPEN_EVENT = 'fiivoo:open-global-search'

// Lightweight trigger that any header region can render. It just asks the
// single GlobalSearch dialog (mounted once) to open via a custom event, so we
// never duplicate the dialog or its keyboard listener.
export function GlobalSearchTrigger({ variant }: { variant: 'desktop' | 'mobile' }) {
  const t = useTranslations('globalSearch')

  const open = () => window.dispatchEvent(new Event(OPEN_EVENT))

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={open}
        aria-label={t('placeholder')}
        className="inline-flex items-center justify-center h-9 w-9 rounded-md text-foreground hover:bg-muted/50 transition-colors"
      >
        <Search className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={open}
      className="flex items-center gap-2 w-full max-w-md h-10 px-3 rounded-md bg-muted/50 border border-border/50 text-sm text-muted-foreground hover:bg-background transition-colors"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left truncate">{t('placeholder')}</span>
      <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
        ⌘K
      </kbd>
    </button>
  )
}

export function GlobalSearch() {
  const t = useTranslations('globalSearch')
  const router = useRouter()
  const money = useCurrency()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<JobResult[]>([])
  const [estimates, setEstimates] = useState<EstimateResult[]>([])
  const shopIdRef = useRef<string | null>(null)

  // Resolve the current user's shop once the palette is first opened
  useEffect(() => {
    if (!open || shopIdRef.current) return
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', user.id)
        .single()
      if (profile?.shop_id) shopIdRef.current = profile.shop_id
    })()
  }, [open])

  // Open with Cmd/Ctrl+K, or when a trigger dispatches the open event
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    const onOpen = () => setOpen(true)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(OPEN_EVENT, onOpen)
    }
  }, [])

  // Debounced search against jobs + estimates
  useEffect(() => {
    const term = sanitize(query)
    if (term.length < 2) {
      setJobs([])
      setEstimates([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const handle = setTimeout(async () => {
      const shopId = shopIdRef.current
      if (!shopId) {
        if (!cancelled) setLoading(false)
        return
      }
      const supabase = createClient()
      const like = `%${term}%`

      const [jobsRes, estimatesRes] = await Promise.all([
        supabase
          .from('job_cards')
          .select('id, job_number, title, status')
          .eq('shop_id', shopId)
          .or(`job_number.ilike.${like},title.ilike.${like},description.ilike.${like}`)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('estimates')
          .select('id, estimate_number, status, total, currency, customer:customers(name)')
          .eq('shop_id', shopId)
          .or(`estimate_number.ilike.${like},notes.ilike.${like}`)
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      if (cancelled) return
      setJobs((jobsRes.data as JobResult[]) || [])
      setEstimates((estimatesRes.data as unknown as EstimateResult[]) || [])
      setLoading(false)
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [query])

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery('')
      router.push(href)
    },
    [router],
  )

  const hasResults = jobs.length > 0 || estimates.length > 0
  const showEmpty = !loading && sanitize(query).length >= 2 && !hasResults

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg" showCloseButton={false}>
          <DialogTitle className="sr-only">{t('title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('description')}</DialogDescription>
          <Command
            shouldFilter={false}
            className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2"
          >
            <CommandInput
              placeholder={t('placeholder')}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-[60vh]">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('searching')}
                </div>
              )}

              {!loading && sanitize(query).length < 2 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t('hint')}
                </div>
              )}

              {showEmpty && <CommandEmpty>{t('noResults')}</CommandEmpty>}

              {jobs.length > 0 && (
                <CommandGroup heading={t('jobs')}>
                  {jobs.map((job) => (
                    <CommandItem
                      key={job.id}
                      value={`job-${job.id}`}
                      onSelect={() => go(`/dashboard/jobs/${job.id}`)}
                      className="gap-3"
                    >
                      <Briefcase className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {job.title || t('untitledJob')}
                        </p>
                        {job.job_number && (
                          <p className="truncate text-xs text-muted-foreground font-mono">
                            {job.job_number}
                          </p>
                        )}
                      </div>
                      {job.status && (
                        <span className="text-xs text-muted-foreground capitalize shrink-0">
                          {job.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {estimates.length > 0 && (
                <CommandGroup heading={t('estimates')}>
                  {estimates.map((est) => (
                    <CommandItem
                      key={est.id}
                      value={`estimate-${est.id}`}
                      onSelect={() => go(`/dashboard/estimates/${est.id}`)}
                      className="gap-3"
                    >
                      <FileText className="h-4 w-4 text-accent shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium font-mono">
                          {est.estimate_number || t('untitledEstimate')}
                        </p>
                        {est.customer?.name && (
                          <p className="truncate text-xs text-muted-foreground">
                            {est.customer.name}
                          </p>
                        )}
                      </div>
                      {typeof est.total === 'number' && (
                        <span className="text-xs font-medium shrink-0">
                          {money.formatIn(est.total, toCurrencyCode(est.currency))}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>

            <div className="flex items-center justify-end gap-1.5 border-t border-border/50 px-3 py-2 text-[11px] text-muted-foreground">
              <CornerDownLeft className="h-3 w-3" />
              <span>{t('footerHint')}</span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
  )
}
