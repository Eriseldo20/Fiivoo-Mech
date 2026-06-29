'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { TRACKING_STAGES, STAGE_ICONS, STAGE_I18N_KEY, stageIndex, type TrackingStage } from '@/lib/tracking'
import { Check } from 'lucide-react'

export function TrackingStepper({ stage }: { stage: TrackingStage }) {
  const t = useTranslations('tracking')
  const current = stageIndex(stage)
  const isFinished = stage === 'finished'

  return (
    <div className="w-full">
      {/* Mobile: vertical stepper */}
      <ol className="flex flex-col gap-0 sm:hidden">
        {TRACKING_STAGES.map((s, i) => {
          const Icon = STAGE_ICONS[s]
          const done = i < current
          const active = i === current
          return (
            <li key={s} className="flex items-stretch gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    done && 'border-primary bg-primary text-primary-foreground',
                    active && !isFinished && 'border-primary bg-primary/10 text-primary',
                    active && isFinished && 'border-emerald-500 bg-emerald-500 text-white',
                    !done && !active && 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </span>
                {i < TRACKING_STAGES.length - 1 && (
                  <span className={cn('w-0.5 flex-1 my-1', i < current ? 'bg-primary' : 'bg-border')} />
                )}
              </div>
              <div className={cn('pb-6 pt-2', active ? 'text-foreground' : 'text-muted-foreground')}>
                <p className={cn('text-sm font-semibold', active && 'text-primary', active && isFinished && 'text-emerald-600')}>
                  {t(STAGE_I18N_KEY[s])}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Desktop: horizontal stepper */}
      <ol className="hidden items-start sm:flex">
        {TRACKING_STAGES.map((s, i) => {
          const Icon = STAGE_ICONS[s]
          const done = i < current
          const active = i === current
          return (
            <li key={s} className="flex flex-1 flex-col items-center text-center last:flex-none">
              <div className="flex w-full items-center">
                <span className={cn('h-0.5 flex-1', i === 0 ? 'opacity-0' : i <= current ? 'bg-primary' : 'bg-border')} />
                <span
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    done && 'border-primary bg-primary text-primary-foreground',
                    active && !isFinished && 'border-primary bg-primary/10 text-primary',
                    active && isFinished && 'border-emerald-500 bg-emerald-500 text-white',
                    !done && !active && 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                </span>
                <span className={cn('h-0.5 flex-1', i === TRACKING_STAGES.length - 1 ? 'opacity-0' : i < current ? 'bg-primary' : 'bg-border')} />
              </div>
              <p
                className={cn(
                  'mt-3 max-w-[8rem] text-sm font-medium',
                  active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground',
                  active && isFinished && 'text-emerald-600',
                )}
              >
                {t(STAGE_I18N_KEY[s])}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
