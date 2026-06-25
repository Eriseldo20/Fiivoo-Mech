import Image from "next/image"
import { Check } from "lucide-react"

const points = [
  "Real-time dashboard for revenue, jobs, and expenses",
  "Multi-language support for your whole team",
  "Secure, GDPR-compliant cloud storage",
  "Works on any device — desk, tablet, or phone",
]

export function LandingProduct() {
  return (
    <section id="product" className="scroll-mt-20 border-t border-[oklch(0.20_0.025_260)] py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.70_0.18_264)]">
            One clear view
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[oklch(0.97_0_0)] sm:text-4xl">
            Know exactly how your shop is performing
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-[oklch(0.72_0.02_260)]">
            Stop guessing. Fiivoo turns the day-to-day activity of your workshop into clear numbers and
            trends, so you can make confident decisions and grow.
          </p>

          <ul className="mt-8 space-y-3.5">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[oklch(0.62_0.20_264)/0.15] text-[oklch(0.74_0.16_264)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm leading-relaxed text-[oklch(0.82_0.02_260)]">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 rounded-3xl opacity-30 blur-2xl"
            style={{ background: "radial-gradient(circle at 70% 30%, oklch(0.62 0.20 264 / 0.5), transparent 65%)" }}
          />
          <div className="relative overflow-hidden rounded-2xl border border-[oklch(0.24_0.025_260)] bg-[oklch(0.11_0.02_259)] shadow-2xl">
            <Image
              src="/landing/dashboard-preview.png"
              alt="Fiivoo analytics dashboard"
              width={1200}
              height={750}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
