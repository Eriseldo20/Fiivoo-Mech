import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Plus, Search, Filter, Car, Clock, DollarSign, Wrench } from "lucide-react"
import {
  EstimateConversionSuccess,
  InlineConversionCheck,
} from "@/components/estimate-conversion-success"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EstimateStatus = "draft" | "pending" | "accepted" | "rejected"

type Estimate = {
  id: string
  number: string
  jobCardNumber?: string
  customer: string
  vehicle: string
  description: string
  amount: number
  status: EstimateStatus
  date: string
  converting?: boolean
}

// ---------------------------------------------------------------------------
// Static seed data
// ---------------------------------------------------------------------------

const SEED: Estimate[] = [
  {
    id: "1",
    number: "EST-1041",
    customer: "Jane Cooper",
    vehicle: "2019 Toyota Hilux",
    description: "Full service + brake pad replacement",
    amount: 4850,
    status: "pending",
    date: "9 Jun 2026",
  },
  {
    id: "2",
    number: "EST-1042",
    customer: "Marcus Webb",
    vehicle: "2021 Ford Ranger",
    description: "Suspension inspection & shock absorber swap",
    amount: 7200,
    status: "pending",
    date: "8 Jun 2026",
  },
  {
    id: "3",
    number: "EST-1039",
    customer: "Priya Naidoo",
    vehicle: "2020 VW Polo",
    description: "Timing belt replacement",
    amount: 3100,
    status: "draft",
    date: "7 Jun 2026",
  },
  {
    id: "4",
    number: "EST-1038",
    customer: "Sipho Dlamini",
    vehicle: "2018 Isuzu D-Max",
    description: "Clutch replacement + gearbox service",
    amount: 12400,
    status: "accepted",
    jobCardNumber: "JOB-0091",
    date: "5 Jun 2026",
  },
  {
    id: "5",
    number: "EST-1035",
    customer: "Anele Mokoena",
    vehicle: "2022 Hyundai Tucson",
    description: "AC regas + cabin filter",
    amount: 1850,
    status: "rejected",
    date: "3 Jun 2026",
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_META: Record<
  EstimateStatus,
  { label: string; color: string; bg: string }
> = {
  draft:    { label: "Draft",    color: "text-[var(--color-subtle)]",          bg: "bg-[var(--color-surface-raised)]" },
  pending:  { label: "Pending",  color: "text-[var(--color-status-pending)]",  bg: "bg-amber-500/10" },
  accepted: { label: "Accepted", color: "text-[var(--color-status-accepted)]", bg: "bg-emerald-500/10" },
  rejected: { label: "Rejected", color: "text-[var(--color-status-rejected)]", bg: "bg-red-500/10" },
}

function fmt(n: number) {
  return `R ${n.toLocaleString("en-ZA")}`
}

function nextJobNum(estimates: Estimate[]) {
  const nums = estimates
    .filter((e) => e.jobCardNumber)
    .map((e) => parseInt(e.jobCardNumber!.replace("JOB-", ""), 10))
  const max = nums.length ? Math.max(...nums) : 90
  return `JOB-${String(max + 1).padStart(4, "0")}`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function EstimatesDemoPage() {
  const [estimates, setEstimates] = useState<Estimate[]>(SEED)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<EstimateStatus | "all">("all")

  // Overlay state
  const [overlay, setOverlay] = useState<{
    open: boolean
    estimateNumber: string
    jobCardNumber: string
    subtitle: string
  }>({ open: false, estimateNumber: "", jobCardNumber: "", subtitle: "" })

  const filtered = estimates.filter((e) => {
    const matchesSearch =
      search === "" ||
      e.customer.toLowerCase().includes(search.toLowerCase()) ||
      e.number.toLowerCase().includes(search.toLowerCase()) ||
      e.vehicle.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = activeFilter === "all" || e.status === activeFilter
    return matchesSearch && matchesFilter
  })

  const handleConvert = (id: string) => {
    const est = estimates.find((e) => e.id === id)
    if (!est || est.status === "accepted") return

    const jobNum = nextJobNum(estimates)

    // Mark as converting (shows spinner on button)
    setEstimates((prev) =>
      prev.map((e) => (e.id === id ? { ...e, converting: true } : e))
    )

    // Simulate async mutation (replace with: await convertToJobCard({ estimateId }))
    setTimeout(() => {
      setEstimates((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, status: "accepted", jobCardNumber: jobNum, converting: false }
            : e
        )
      )
      setOverlay({
        open: true,
        estimateNumber: est.number,
        jobCardNumber: jobNum,
        subtitle: `${est.vehicle} · ${est.customer}`,
      })
    }, 1200)
  }

  const FILTERS: { value: EstimateStatus | "all"; label: string }[] = [
    { value: "all",      label: "All" },
    { value: "pending",  label: "Pending" },
    { value: "draft",    label: "Draft" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
  ]

  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-foreground)] tracking-tight">
              Estimates
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {estimates.filter((e) => e.status === "pending").length} pending &middot;{" "}
              {estimates.filter((e) => e.status === "accepted").length} converted
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-light)] transition-colors">
            <Plus className="h-4 w-4" />
            New estimate
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-subtle)] pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, estimate, vehicle…"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-4 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
            <Filter className="h-3.5 w-3.5 text-[var(--color-subtle)] ml-1.5" />
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={[
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  activeFilter === f.value
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-foreground)]"
                    : "text-[var(--color-subtle)] hover:text-[var(--color-muted)]",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-[var(--color-border-subtle)] text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
            <span>Estimate</span>
            <span className="hidden sm:block">Amount</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {/* Rows */}
          <AnimatePresence initial={false}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-[var(--color-subtle)]">
                <Wrench className="h-8 w-8 opacity-30" />
                <p className="text-sm">No estimates match your filter.</p>
              </div>
            ) : (
              filtered.map((est, i) => (
                <EstimateRow
                  key={est.id}
                  estimate={est}
                  isLast={i === filtered.length - 1}
                  onConvert={() => handleConvert(est.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Full overlay */}
      <EstimateConversionSuccess
        open={overlay.open}
        onClose={() => setOverlay((o) => ({ ...o, open: false }))}
        estimateNumber={overlay.estimateNumber}
        jobCardNumber={overlay.jobCardNumber}
        subtitle={overlay.subtitle}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function EstimateRow({
  estimate: est,
  isLast,
  onConvert,
}: {
  estimate: Estimate
  isLast: boolean
  onConvert: () => void
}) {
  const meta = STATUS_META[est.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={[
        "grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4",
        !isLast && "border-b border-[var(--color-border-subtle)]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Info */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-muted)]">
          <Car className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
            {est.customer}
          </p>
          <p className="text-xs text-[var(--color-subtle)] truncate">
            {est.number} &middot; {est.vehicle}
          </p>
          <p className="text-xs text-[var(--color-subtle)] truncate mt-0.5 hidden sm:block">
            {est.description}
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="hidden sm:flex flex-col items-end gap-0.5">
        <span className="flex items-center gap-1 text-sm font-medium text-[var(--color-foreground)]">
          <DollarSign className="h-3.5 w-3.5 text-[var(--color-subtle)]" />
          {fmt(est.amount)}
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--color-subtle)]">
          <Clock className="h-3 w-3" />
          {est.date}
        </span>
      </div>

      {/* Status badge */}
      <span
        className={[
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
          meta.color,
          meta.bg,
        ].join(" ")}
      >
        {est.status === "accepted" && est.jobCardNumber ? (
          <InlineConversionCheck
            converted
            label={est.jobCardNumber}
            size={14}
          />
        ) : (
          meta.label
        )}
      </span>

      {/* Action */}
      <div className="flex justify-end">
        {est.status === "pending" || est.status === "draft" ? (
          <button
            onClick={onConvert}
            disabled={!!est.converting}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand-light)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {est.converting ? (
              <>
                <motion.span
                  className="h-3 w-3 rounded-full border-2 border-[var(--color-brand-light)] border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                />
                Converting…
              </>
            ) : (
              <>
                <Wrench className="h-3 w-3" />
                Convert
              </>
            )}
          </button>
        ) : (
          <span className="text-xs text-[var(--color-subtle)] pr-1">—</span>
        )}
      </div>
    </motion.div>
  )
}
