'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { isTrackingStage, type TrackingStage, DEFAULT_TRACKING_STAGE } from '@/lib/tracking'
import { TrackingStepper } from './tracking-stepper'
import { Car, Loader2, Search, AlertCircle, RotateCcw, Wifi } from 'lucide-react'

interface TrackingResult {
  job_id: string
  job_title: string | null
  stage: string
  stage_updated_at: string
  vehicle_make: string | null
  vehicle_model: string | null
  vehicle_year: number | null
  vehicle_plate: string | null
}

function formatRelative(iso: string, locale: string) {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const mins = Math.round(diffMs / 60000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (mins < 1) return rtf.format(0, 'minute')
  if (mins < 60) return rtf.format(-mins, 'minute')
  const hours = Math.round(mins / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-Math.round(hours / 24), 'day')
}

export function TrackingPortal({ initialToken = '', locale = 'en' }: { initialToken?: string; locale?: string }) {
  const t = useTranslations('tracking')
  const [token, setToken] = useState(initialToken)
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [live, setLive] = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  const stage: TrackingStage = result && isTrackingStage(result.stage) ? result.stage : DEFAULT_TRACKING_STAGE

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: rpcError } = await supabase.rpc('verify_tracking', {
        p_token: token.trim(),
        p_last_name: lastName.trim(),
      })
      if (rpcError) throw rpcError
      const row = Array.isArray(data) ? data[0] : data
      if (!row) {
        setError(t('notFound'))
        setResult(null)
        return
      }
      setResult(row as TrackingResult)
    } catch {
      setError(t('genericError'))
    } finally {
      setLoading(false)
    }
  }

  // Realtime subscription: listen for stage changes on the matched job.
  useEffect(() => {
    if (!result) return
    const supabase = createClient()
    const channel = supabase
      .channel(`track:${result.job_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_tracking_public',
          filter: `job_id=eq.${result.job_id}`,
        },
        (payload) => {
          const next = payload.new as { stage: string; updated_at: string }
          setResult((prev) =>
            prev ? { ...prev, stage: next.stage, stage_updated_at: next.updated_at } : prev,
          )
        },
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      setLive(false)
    }
  }, [result?.job_id]) // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setResult(null)
    setError(null)
    setLastName('')
  }

  if (result) {
    const vehicle = [result.vehicle_year, result.vehicle_make, result.vehicle_model]
      .filter(Boolean)
      .join(' ')
    return (
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Car className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold leading-tight text-foreground">
                  {vehicle || t('yourVehicle')}
                </p>
                {result.vehicle_plate && (
                  <p className="text-sm text-muted-foreground">{result.vehicle_plate}</p>
                )}
              </div>
            </div>
            {live && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t('live')}
              </span>
            )}
          </div>

          {result.job_title && (
            <div className="mb-6 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('jobLabel')}</p>
              <p className="font-medium text-foreground">{result.job_title}</p>
            </div>
          )}

          <TrackingStepper stage={stage} />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('lastUpdated', { time: formatRelative(result.stage_updated_at, locale) })}
          </p>
        </div>

        <button
          onClick={reset}
          className="mx-auto mt-5 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('trackAnother')}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">{t('subtitle')}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lastName">{t('lastNameLabel')}</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t('lastNamePlaceholder')}
              autoComplete="family-name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="token">{t('tokenLabel')}</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              placeholder={t('tokenPlaceholder')}
              className="font-mono tracking-wider"
              required
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" disabled={loading} className="mt-6 w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          {t('trackButton')}
        </Button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Wifi className="h-3 w-3" />
          {t('realtimeHint')}
        </p>
      </form>
    </div>
  )
}
