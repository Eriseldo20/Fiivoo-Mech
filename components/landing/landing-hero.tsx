import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ShieldCheck } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle, oklch(0.62 0.20 264 / 0.45) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.30_0.04_264)] bg-[oklch(0.62_0.20_264)/0.10] px-3.5 py-1.5 text-xs font-medium text-[oklch(0.80_0.10_264)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.70_0.18_264)]" />
            The all-in-one platform for modern workshops
          </span>

          <h1 className="mt-6 text-pretty text-4xl font-extrabold leading-[1.05] tracking-tight text-[oklch(0.98_0_0)] sm:text-6xl">
            Run your auto shop{" "}
            <span className="text-[oklch(0.70_0.18_264)]">without the chaos</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-[oklch(0.74_0.02_260)] sm:text-lg">
            Fiivoo brings job cards, estimates, inventory, customers, and analytics into one fast,
            beautiful dashboard. Spend less time on paperwork and more time fixing cars.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/sign-up"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[oklch(0.62_0.20_264)] px-6 py-3.5 text-sm font-semibold text-[oklch(0.99_0_0)] shadow-[0_0_28px_oklch(0.62_0.20_264/0.4)] transition-all hover:bg-[oklch(0.68_0.19_264)] hover:shadow-[0_0_40px_oklch(0.62_0.20_264/0.55)] sm:w-auto"
            >
              Start free today
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-[oklch(0.92_0_0)] ring-1 ring-[oklch(0.26_0.025_260)] transition-colors hover:bg-[oklch(0.14_0.02_260)] sm:w-auto"
            >
              Log in
            </Link>
          </div>

          <p className="mt-5 inline-flex items-center gap-2 text-xs text-[oklch(0.62_0.02_260)]">
            <ShieldCheck className="h-4 w-4 text-[oklch(0.70_0.14_264)]" />
            No credit card required · GDPR compliant
          </p>
        </div>

        {/* Product preview */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -top-8 bottom-0 rounded-[2rem] opacity-30 blur-2xl"
            style={{ background: "linear-gradient(180deg, oklch(0.62 0.20 264 / 0.5), transparent 60%)" }}
          />
          <div className="relative overflow-hidden rounded-2xl border border-[oklch(0.24_0.025_260)] bg-[oklch(0.11_0.02_259)] shadow-2xl ring-1 ring-inset ring-[oklch(1_0_0/0.04)]">
            <Image
              src="/landing/dashboard-preview.png"
              alt="Fiivoo dashboard showing job cards, revenue analytics, and vehicle records"
              width={1600}
              height={1000}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
