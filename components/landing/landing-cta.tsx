import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function LandingCta() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[oklch(0.30_0.04_264)] bg-[oklch(0.10_0.025_260)] px-6 py-14 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, oklch(0.62 0.20 264 / 0.35) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight text-[oklch(0.98_0_0)] sm:text-5xl">
            Ready to modernize your workshop?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-[oklch(0.76_0.02_260)]">
            Join the shops already running smoother with Fiivoo. Get started in minutes — it&apos;s free.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/sign-up"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[oklch(0.62_0.20_264)] px-7 py-3.5 text-sm font-semibold text-[oklch(0.99_0_0)] shadow-[0_0_28px_oklch(0.62_0.20_264/0.45)] transition-all hover:bg-[oklch(0.68_0.19_264)] sm:w-auto"
            >
              Start free today
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center rounded-xl px-7 py-3.5 text-sm font-semibold text-[oklch(0.92_0_0)] ring-1 ring-[oklch(0.28_0.03_262)] transition-colors hover:bg-[oklch(0.14_0.02_260)] sm:w-auto"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
