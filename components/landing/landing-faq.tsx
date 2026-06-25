"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "Sa shpejt mund të filloj?",
    a: "Brenda minutash. Krijo një llogari, konfiguro profilin e servisit dhe mund të fillosh menjëherë të krijosh kartela pune dhe preventiva — pa instalim apo trajnim.",
  },
  {
    q: "A mund ta përdorë i gjithë ekipi?",
    a: "Po. Fto mekanikët dhe stafin e recepsionit që të gjithë të punojnë me të njëjtin informacion të përditësuar, në çdo pajisje.",
  },
  {
    q: "A janë të dhënat e mia të sigurta?",
    a: "Absolutisht. Të dhënat ruhen të sigurta në cloud me enkriptim gjatë transmetimit, dhe Fiivoo është ndërtuar në përputhje me GDPR, përfshirë mjetet e eksportit dhe fshirjes së të dhënave.",
  },
  {
    q: "A më duhet kartë krediti për ta provuar?",
    a: "Jo. Plani Fillestar është falas përgjithmonë, dhe planet me pagesë vijnë me provë falas — pa kartë krediti për të nisur.",
  },
  {
    q: "A mund t'i eksportoj të dhënat e mia?",
    a: "Po. Mund të eksportosh një kopje të plotë të të dhënave të servisit në çdo kohë nga cilësimet, që të mos jesh kurrë i bllokuar.",
  },
]

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="scroll-mt-20 border-t border-[oklch(0.92_0.006_260)] bg-[oklch(0.98_0.003_260)] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.55_0.20_264)]">
            Pyetje
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[oklch(0.22_0.03_262)] sm:text-4xl">
            Pyetjet, të përgjigjura
          </h2>
        </div>

        <div className="mt-12 divide-y divide-[oklch(0.92_0.006_260)] overflow-hidden rounded-2xl border border-[oklch(0.92_0.006_260)] bg-white">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[oklch(0.98_0.003_260)]"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-[oklch(0.24_0.03_262)] sm:text-base">{faq.q}</span>
                  <span className="shrink-0 text-[oklch(0.55_0.20_264)]">
                    {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </span>
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-relaxed text-[oklch(0.50_0.02_260)]">{faq.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
