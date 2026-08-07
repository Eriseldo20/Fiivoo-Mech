'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { enableTracking, disableTracking, setTrackingStage } from '@/lib/actions/tracking'
import { TRACKING_STAGES, STAGE_ICONS, STAGE_I18N_KEY, type TrackingStage } from '@/lib/tracking'
import { Radar, Copy, Check, Link2, ExternalLink } from 'lucide-react'

interface JobTrackingPanelProps {
  jobId: string
  enabled: boolean
  token: string | null
  stage: string
}

export function JobTrackingPanel({ jobId, enabled, token, stage }: JobTrackingPanelProps) {
  const t = useTranslations('tracking')
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [currentToken, setCurrentToken] = useState(token)
  const [currentStage, setCurrentStage] = useState<TrackingStage>(
    (TRACKING_STAGES as readonly string[]).includes(stage) ? (stage as TrackingStage) : 'waiting',
  )
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const trackUrl =
    currentToken && typeof window !== 'undefined'
      ? `${window.location.origin}/track/${currentToken}`
      : ''

  function handleToggle(next: boolean) {
    setIsEnabled(next)
    startTransition(async () => {
      const res = next ? await enableTracking(jobId) : await disableTracking(jobId)
      if (!res.success) {
        setIsEnabled(!next)
        toast.error(res.error ?? t('errorToast'))
        return
      }
      if (next && 'token' in res && typeof res.token === 'string') setCurrentToken(res.token)
      toast.success(next ? t('enabledToast') : t('disabledToast'))
    })
  }

  function handleStage(s: TrackingStage) {
    const prev = currentStage
    setCurrentStage(s)
    startTransition(async () => {
      const res = await setTrackingStage(jobId, s)
      if (!res.success) {
        setCurrentStage(prev)
        toast.error(res.error ?? t('errorToast'))
        return
      }
      toast.success(t('stageUpdatedToast'))
    })
  }

  async function copy(value: string, which: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      toast.error(t('copyError'))
    }
  }

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Radar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold leading-tight">{t('panelTitle')}</h2>
            <p className="text-xs text-muted-foreground">{t('panelSubtitle')}</p>
          </div>
        </div>
        <Switch checked={isEnabled} onCheckedChange={handleToggle} disabled={pending} aria-label={t('panelTitle')} />
      </div>

      {!isEnabled ? (
        <p className="text-sm text-muted-foreground">{t('disabledHint')}</p>
      ) : (
        <div className="space-y-5">
          {/* Token + link */}
          {currentToken && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t('codeLabel')}</p>
                  <p className="font-mono text-lg font-semibold tracking-[0.2em] text-foreground">{currentToken}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => copy(currentToken, 'code')}>
                  {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => copy(trackUrl, 'link')}>
                  {copied === 'link' ? <Check className="h-4 w-4 mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                  {copied === 'link' ? t('copied') : t('copyLink')}
                </Button>
                <a href={trackUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
              <p className="text-xs text-muted-foreground">{t('shareHint')}</p>
            </div>
          )}

          {/* Stage selector */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('stageSelectorLabel')}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TRACKING_STAGES.map((s) => {
                const Icon = STAGE_ICONS[s]
                const active = s === currentStage
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStage(s)}
                    disabled={pending}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-60',
                      active
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background/50 text-foreground hover:bg-muted/40',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t(STAGE_I18N_KEY[s])}</span>
                    {active && <Check className="ml-auto h-4 w-4" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
