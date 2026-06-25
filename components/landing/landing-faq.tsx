"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "How quickly can I get started?",
    a: "In minutes. Create an account, set up your shop profile, and you can start creating job cards and estimates right away — no installation or training required.",
  },
  {
    q: "Can my whole team use it?",
    a: "Yes. Invite your mechanics and front-desk staff so everyone works from the same up-to-date information, on any device.",
  },
  {
    q: "Is my data safe?",
    a: "Absolutely. Your data is stored securely in the cloud with encryption in transit, and Fiivoo is built to be GDPR compliant, including data export and erasure tools.",
  },
  {
    q: "Do I need a credit card to try it?",
    a: "No. The Starter plan is free forever, and paid plans come with a free trial — no credit card required to begin.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You can export a complete copy of your shop's data at any time from your settings, so you're never locked in.",
  },
]

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="scroll-mt-20 border-t border-[oklch(0.20_0.025_260)] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.70_0.18_264)]">
            FAQ
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[oklch(0.97_0_0)] sm:text-4xl">
            Questions, answered
          </h2>
        </div>

        <div className="mt-12 divide-y divide-[oklch(0.20_0.025_260)] overflow-hidden rounded-2xl border border-[oklch(0.22_0.025_260)] bg-[oklch(0.09_0.02_258)]">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[oklch(0.12_0.02_259)]"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-[oklch(0.94_0_0)] sm:text-base">{faq.q}</span>
                  <span className="shrink-0 text-[oklch(0.70_0.16_264)]">
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
                    <p className="px-6 pb-5 text-sm leading-relaxed text-[oklch(0.70_0.02_260)]">{faq.a}</p>
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
