import Link from "next/link"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "For solo mechanics getting organized.",
    features: ["Up to 30 job cards/mo", "Estimates & PDF export", "Customer & vehicle records", "1 user"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Workshop",
    price: "$49",
    period: "/mo",
    description: "For growing shops that need the full toolkit.",
    features: [
      "Unlimited job cards",
      "Inventory & low-stock alerts",
      "Analytics dashboard",
      "Service reminders",
      "Up to 10 users",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For multi-location businesses.",
    features: ["Everything in Workshop", "Multiple locations", "Priority support", "Custom onboarding"],
    cta: "Contact sales",
    featured: false,
  },
]

export function LandingPricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-[oklch(0.20_0.025_260)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.70_0.18_264)]">
            Simple pricing
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[oklch(0.97_0_0)] sm:text-4xl">
            Plans that grow with your shop
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-[oklch(0.72_0.02_260)]">
            Start free and upgrade when you&apos;re ready. No contracts, cancel anytime.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-7",
                plan.featured
                  ? "border-[oklch(0.62_0.20_264)/0.5] bg-[oklch(0.12_0.03_261)] shadow-[0_0_40px_oklch(0.62_0.20_264/0.15)]"
                  : "border-[oklch(0.22_0.025_260)] bg-[oklch(0.10_0.02_259)]",
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-[oklch(0.62_0.20_264)] px-3 py-1 text-xs font-semibold text-[oklch(0.99_0_0)]">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-[oklch(0.96_0_0)]">{plan.name}</h3>
              <p className="mt-1 text-sm text-[oklch(0.68_0.02_260)]">{plan.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-[oklch(0.98_0_0)]">
                  {plan.price}
                </span>
                <span className="text-sm text-[oklch(0.62_0.02_260)]">{plan.period}</span>
              </div>

              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.74_0.16_264)]" />
                    <span className="text-sm leading-relaxed text-[oklch(0.80_0.02_260)]">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/sign-up"
                className={cn(
                  "mt-8 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all",
                  plan.featured
                    ? "bg-[oklch(0.62_0.20_264)] text-[oklch(0.99_0_0)] shadow-[0_0_24px_oklch(0.62_0.20_264/0.4)] hover:bg-[oklch(0.68_0.19_264)]"
                    : "text-[oklch(0.92_0_0)] ring-1 ring-[oklch(0.26_0.025_260)] hover:bg-[oklch(0.14_0.02_260)]",
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
