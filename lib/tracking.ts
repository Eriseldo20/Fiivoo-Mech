import type { LucideIcon } from 'lucide-react'
import { Clock, CircleDashed, Wrench, Sparkles, CheckCircle2 } from 'lucide-react'

/**
 * The five client-facing tracking stages, in order.
 * These map to the `tracking_stage` column / check constraint on job_cards.
 */
export const TRACKING_STAGES = [
  'waiting',
  'not_started',
  'in_process',
  'almost_done',
  'finished',
] as const

export type TrackingStage = (typeof TRACKING_STAGES)[number]

export const DEFAULT_TRACKING_STAGE: TrackingStage = 'waiting'

/** Icon for each stage (used by both portal and shop panel). */
export const STAGE_ICONS: Record<TrackingStage, LucideIcon> = {
  waiting: Clock,
  not_started: CircleDashed,
  in_process: Wrench,
  almost_done: Sparkles,
  finished: CheckCircle2,
}

/** i18n key for each stage, resolved against the `tracking` namespace. */
export const STAGE_I18N_KEY: Record<TrackingStage, string> = {
  waiting: 'stageWaiting',
  not_started: 'stageNotStarted',
  in_process: 'stageInProcess',
  almost_done: 'stageAlmostDone',
  finished: 'stageFinished',
}

export function stageIndex(stage: string): number {
  const i = TRACKING_STAGES.indexOf(stage as TrackingStage)
  return i === -1 ? 0 : i
}

export function isTrackingStage(value: string): value is TrackingStage {
  return (TRACKING_STAGES as readonly string[]).includes(value)
}
