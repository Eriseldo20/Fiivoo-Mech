"use client"

import { useState } from "react"
import { ArrowRight, FileText } from "lucide-react"
import { EstimateConversionSuccess, InlineConversionCheck } from "@/components/estimate-conversion-success"

/**
 * Demo / reference for the conversion animations.
 *
 * This is a self-contained example with local state so you can see both the
 * overlay (EstimateConversionSuccess) and the inline indicator
 * (InlineConversionCheck) working together. In your Hercules app, replace the
 * fake `convert()` below with your real Convex mutation:
 *
 *   const convertToJobCard = useMutation(api.estimates.convertToJobCard)
 *   await convertToJobCard({ estimateId: row._id })
 */

type Row = {
  id: string
  estimateNumber: string
  jobCardNumber: string
  customer: string
  vehicle: string
  amount: string
  converted: boolean
}

const INITIAL_ROWS: Row[] = [
  {
    id: "1",
    estimateNumber: "EST-1042",
    jobCardNumber: "JOB-0098",
    customer: "Jane Cooper",
    vehicle: "Toyota Hilux",
    amount: "$1,240",
    converted: false,
  },
  {
    id: "2",
    estimateNumber: "EST-1043",
    jobCardNumber: "JOB-0099",
    customer: "Marcus Lee",
    vehicle: "Ford Ranger",
    amount: "$860",
    converted: false,
  },
  {
    id: "3",
    estimateNumber: "EST-1040",
    jobCardNumber: "JOB-0096",
    customer: "Aisha Khan",
    vehicle: "Mazda BT-50",
    amount: "$2,310",
    converted: true,
  },
]

export function EstimatesListDemo() {
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [overlayRow, setOverlayRow] = useState<Row | null>(null)

  async function handleConvert(row: Row) {
    setPendingId(row.id)
    // Simulate the Convex mutation latency. Replace with your real mutation.
    await new Promise((r) => setTimeout(r, 700))
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, converted: true } : r)))
    setPendingId(null)
    setOverlayRow({ ...row, converted: true })
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <header className="mb-4">
        <h1 className="text-balance text-xl font-semibold text-foreground">Estimates</h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Convert an accepted estimate into a job card.
        </p>
      </header>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-4 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileText className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-card-foreground">{row.estimateNumber}</p>
                <span className="text-xs text-muted-foreground">{row.amount}</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {row.customer} · {row.vehicle}
              </p>
            </div>

            <div className="shrink-0">
              {row.converted ? (
                <InlineConversionCheck converted label={row.jobCardNumber} />
              ) : (
                <button
                  type="button"
                  onClick={() => handleConvert(row)}
                  disabled={pendingId === row.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingId === row.id ? "Converting…" : "Convert to job card"}
                  {pendingId !== row.id ? <ArrowRight className="size-3.5" /> : null}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <EstimateConversionSuccess
        open={overlayRow !== null}
        onClose={() => setOverlayRow(null)}
        estimateNumber={overlayRow?.estimateNumber}
        jobCardNumber={overlayRow?.jobCardNumber}
        subtitle={overlayRow ? `${overlayRow.vehicle} · ${overlayRow.customer}` : undefined}
      />
    </div>
  )
}
