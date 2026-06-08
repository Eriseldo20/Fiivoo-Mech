"use client"

import { useEffect } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowRight, FileText, Wrench } from "lucide-react"

type EstimateConversionSuccessProps = {
  /** Controls visibility of the success overlay. */
  open: boolean
  /** Called when the overlay finishes / is dismissed. */
  onClose?: () => void
  /** e.g. "EST-1042" — shown on the left card. */
  estimateNumber?: string
  /** e.g. "JOB-0098" — shown on the right card. */
  jobCardNumber?: string
  /** Optional context line, e.g. the customer or vehicle. */
  subtitle?: string
  /** Auto-dismiss after this many ms. Set to 0 to disable. Default 2600. */
  autoCloseMs?: number
}

/**
 * A polished, professional "estimate → job card" conversion confirmation.
 *
 * Renders a centered overlay with an animated green circle + drawing check mark,
 * a soft pulsing ring, and a card-to-card transition. Built on `motion`
 * (Framer Motion v12) and `lucide-react`, both already in this project.
 *
 * Usage:
 *   const [done, setDone] = useState(false)
 *   // after your convertToJobCard mutation resolves: setDone(true)
 *   <EstimateConversionSuccess
 *     open={done}
 *     onClose={() => setDone(false)}
 *     estimateNumber="EST-1042"
 *     jobCardNumber="JOB-0098"
 *     subtitle="Toyota Hilux · Jane Cooper"
 *   />
 */
export function EstimateConversionSuccess({
  open,
  onClose,
  estimateNumber,
  jobCardNumber,
  subtitle,
  autoCloseMs = 2600,
}: EstimateConversionSuccessProps) {
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open || !autoCloseMs) return
    const id = window.setTimeout(() => onClose?.(), autoCloseMs)
    return () => window.clearTimeout(id)
  }, [open, autoCloseMs, onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-label="Estimate converted to job card"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm"
          />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card p-8 text-center shadow-2xl"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
          >
            <SuccessCheck reduceMotion={!!reduceMotion} />

            <motion.h2
              className="mt-6 text-balance text-xl font-semibold text-card-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.5 }}
            >
              Job card created
            </motion.h2>

            <motion.p
              className="mt-1 text-pretty text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.58 }}
            >
              {subtitle ?? "The estimate was accepted and converted successfully."}
            </motion.p>

            {/* Estimate → Job card transition */}
            <motion.div
              className="mt-6 flex items-center justify-center gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.66 }}
            >
              <Pill icon={<FileText className="size-4" />} label={estimateNumber ?? "Estimate"} muted />
              <motion.span
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.78 }}
                className="text-muted-foreground"
              >
                <ArrowRight className="size-4" />
              </motion.span>
              <Pill icon={<Wrench className="size-4" />} label={jobCardNumber ?? "Job card"} />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function Pill({
  icon,
  label,
  muted = false,
}: {
  icon: React.ReactNode
  label: string
  muted?: boolean
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
        muted
          ? "border-border bg-muted text-muted-foreground"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      ].join(" ")}
    >
      {icon}
      {label}
    </span>
  )
}

function SuccessCheck({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative mx-auto flex size-24 items-center justify-center">
      {/* Pulsing ring */}
      {!reduceMotion ? (
        <motion.span
          className="absolute inset-0 rounded-full bg-emerald-500/20"
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }}
        />
      ) : null}

      {/* Green circle */}
      <motion.div
        className="relative flex size-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30"
        initial={reduceMotion ? { scale: 1 } : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 18, delay: reduceMotion ? 0 : 0.1 }}
      >
        {/* Drawing check mark */}
        <svg viewBox="0 0 24 24" fill="none" className="size-11" aria-hidden="true">
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="white"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.34, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>
    </div>
  )
}
