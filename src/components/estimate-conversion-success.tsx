/**
 * estimate-conversion-success.tsx
 *
 * Two drop-in components for the estimate → job card conversion flow:
 *
 *  1. EstimateConversionSuccess  – full-screen overlay celebration
 *  2. InlineConversionCheck      – compact inline row/button indicator
 *
 * Both use `motion` (Framer Motion v12) and respect prefers-reduced-motion.
 */

import { useEffect } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowRight, FileText, Wrench, X } from "lucide-react"

// ---------------------------------------------------------------------------
// 1. Full overlay
// ---------------------------------------------------------------------------

type EstimateConversionSuccessProps = {
  open: boolean
  onClose: () => void
  estimateNumber?: string
  jobCardNumber?: string
  subtitle?: string
  /** Auto-dismiss after this many ms. Set to 0 to disable. Default 4000. */
  autoDismissMs?: number
}

/**
 * Full-screen overlay shown once after convertToJobCard resolves.
 *
 *   const [success, setSuccess] = useState(false)
 *   await convertToJobCard({ estimateId })
 *   setSuccess(true)
 *
 *   <EstimateConversionSuccess
 *     open={success}
 *     onClose={() => setSuccess(false)}
 *     estimateNumber="EST-1042"
 *     jobCardNumber="JOB-0098"
 *     subtitle="Toyota Hilux · Jane Cooper"
 *   />
 */
export function EstimateConversionSuccess({
  open,
  onClose,
  estimateNumber = "EST-0000",
  jobCardNumber  = "JOB-0000",
  subtitle,
  autoDismissMs  = 4000,
}: EstimateConversionSuccessProps) {
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open || autoDismissMs === 0) return
    const id = setTimeout(onClose, autoDismissMs)
    return () => clearTimeout(id)
  }, [open, autoDismissMs, onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Centering shell */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-label="Estimate converted to job card"
              className="pointer-events-auto relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
            >
              {/* Top accent bar */}
              <div className="h-1 w-full bg-[var(--color-brand)]" />

              {/* Dismiss button */}
              <button
                onClick={onClose}
                aria-label="Dismiss"
                className="absolute top-3 right-3 rounded-md p-1.5 text-[var(--color-subtle)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="px-8 py-8 flex flex-col items-center gap-5 text-center">
                <SuccessCheck reduceMotion={!!reduceMotion} />

                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-foreground)] text-balance">
                    Job card created
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)] text-pretty">
                    {subtitle ?? "The estimate was accepted and converted successfully."}
                  </p>
                </div>

                {/* Estimate → Job card pill */}
                <motion.div
                  className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.5, duration: 0.3 }}
                >
                  <FileText className="h-3.5 w-3.5 text-[var(--color-subtle)] shrink-0" />
                  <span className="text-sm font-mono text-[var(--color-muted)]">{estimateNumber}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--color-subtle)] shrink-0" />
                  <Wrench className="h-3.5 w-3.5 text-[var(--color-brand-light)] shrink-0" />
                  <span className="text-sm font-mono font-medium text-[var(--color-brand-light)]">{jobCardNumber}</span>
                </motion.div>

                {/* Auto-dismiss progress bar */}
                {autoDismissMs > 0 && (
                  <motion.div
                    className="w-full h-0.5 rounded-full bg-[var(--color-brand)]"
                    initial={{ scaleX: 1, originX: 0 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: autoDismissMs / 1000, ease: "linear" }}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Internal: animated check mark
// ---------------------------------------------------------------------------

function SuccessCheck({ reduceMotion }: { reduceMotion: boolean }) {
  const SIZE = 72

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      {/* Outer pulse ring */}
      {!reduceMotion && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-[var(--color-brand)]"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: "easeOut" }}
        />
      )}

      {/* Green circle */}
      <motion.span
        className="flex items-center justify-center rounded-full bg-[var(--color-brand)] shadow-lg"
        style={{
          width: SIZE,
          height: SIZE,
          boxShadow: "0 0 0 0 var(--color-brand)",
        }}
        initial={reduceMotion ? { scale: 1 } : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 460, damping: 22, delay: 0.05 }}
      >
        {/* Drawing check */}
        <svg width={SIZE * 0.5} height={SIZE * 0.5} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="white"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.22, ease: "easeInOut" }}
          />
        </svg>
      </motion.span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. Inline row / button indicator
// ---------------------------------------------------------------------------

type InlineConversionCheckProps = {
  converted: boolean
  label?: string
  size?: number
  className?: string
}

/**
 * Compact inline status for an estimate row or inside a button.
 *
 *   // On a table row:
 *   <InlineConversionCheck
 *     converted={estimate.status === "accepted"}
 *     label={`JOB-${estimate.jobCardNumber}`}
 *   />
 *
 *   // Inside a button:
 *   <button disabled={converted}>
 *     {converted
 *       ? <InlineConversionCheck converted size={16} label="Done" />
 *       : "Convert to job card"}
 *   </button>
 */
export function InlineConversionCheck({
  converted,
  label   = "Converted",
  size    = 20,
  className,
}: InlineConversionCheckProps) {
  const reduceMotion = useReducedMotion()

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-medium text-[var(--color-brand-light)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AnimatePresence initial={false}>
        {converted && (
          <motion.span
            key="circle"
            className="relative inline-flex items-center justify-center rounded-full bg-[var(--color-brand)] shrink-0"
            style={{ width: size, height: size }}
            initial={reduceMotion ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 460, damping: 20 }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              style={{ width: size * 0.62, height: size * 0.62 }}
              aria-hidden="true"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.12, ease: "easeInOut" }}
              />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {converted && label && (
          <motion.span
            key="label"
            className="overflow-hidden whitespace-nowrap text-sm"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -4, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: -4, width: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.22, duration: 0.25 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
