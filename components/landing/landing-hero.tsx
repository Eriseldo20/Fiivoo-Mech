import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ShieldCheck } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      {/* Ambient accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 h-[460px] w-[820px] -translate-x-1/2 rounded-full opacity-50 blur-[120px]"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.20 264 / 0.16) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.90_0.02_264)] bg-[oklch(0.55_0.20_264)/0.07] px-3.5 py-1.5 text-xs font-medium text-[oklch(0.50_0.16_264)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.20_264)]" />
            Platforma gjithëpërfshirëse për servisët modernë
          </span>

          <h1 className="mt-6 text-pretty text-4xl font-extrabold leading-[1.05] tracking-tight text-[oklch(0.20_0.03_262)] sm:text-6xl">
            Drejto servisin tënd{" "}
            <span className="text-[oklch(0.55_0.20_264)]">pa kaos</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-[oklch(0.48_0.02_260)] sm:text-lg">
            Fiivoo bashkon kartelat e punës, preventivat, inventarin, klientët dhe analitikën në një
            panel të vetëm, të shpejtë dhe të bukur. Kalo më pak kohë me letra dhe më shumë duke
            riparuar makina.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/sign-up"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[oklch(0.55_0.20_264)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_oklch(0.55_0.20_264/0.3)] transition-all hover:bg-[oklch(0.50_0.21_264)] sm:w-auto"
            >
              Fillo falas sot
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-[oklch(0.28_0.02_260)] ring-1 ring-[oklch(0.88_0.008_260)] transition-colors hover:bg-[oklch(0.97_0.005_260)] sm:w-auto"
            >
              Hyr
            </Link>
          </div>

          <p className="mt-5 inline-flex items-center gap-2 text-xs text-[oklch(0.55_0.02_260)]">
            <ShieldCheck className="h-4 w-4 text-[oklch(0.55_0.16_264)]" />
            Pa kartë krediti · Në përputhje me GDPR
          </p>
        </div>

        {/* Tilted MacBook mockup */}
        <div className="mt-20 [perspective:2200px]">
          <div className="mx-auto max-w-5xl [transform-style:preserve-3d]">
            {/* Screen */}
            <div
              className="relative mx-auto w-[88%] rounded-t-[1.25rem] bg-[oklch(0.16_0.01_260)] p-[0.7rem] shadow-[0_50px_90px_-30px_oklch(0.20_0.03_262/0.45)] sm:w-full sm:p-3"
              style={{ transform: "rotateX(11deg)", transformOrigin: "bottom center" }}
            >
              {/* Camera notch */}
              <div className="absolute left-1/2 top-[0.32rem] z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[oklch(0.30_0.01_260)] ring-2 ring-[oklch(0.22_0.01_260)] sm:top-1.5" />
              {/* Display */}
              <div className="overflow-hidden rounded-md bg-white ring-1 ring-inset ring-[oklch(0.30_0.01_260)]">
                <Image
                  src="/landing/dashboard-screenshot.png"
                  alt="Paneli i Fiivoo me kartelat e punës, klientët dhe të ardhurat"
                  width={2560}
                  height={1440}
                  className="h-auto w-full"
                  sizes="(max-width: 1024px) 100vw, 960px"
                  priority
                />
              </div>
            </div>

            {/* Base / deck */}
            <div className="relative mx-auto h-3.5 w-full sm:h-4">
              <div className="absolute inset-x-0 top-0 h-full rounded-b-[0.35rem] bg-gradient-to-b from-[oklch(0.82_0.005_260)] to-[oklch(0.70_0.008_260)] shadow-[0_18px_30px_-12px_oklch(0.20_0.03_262/0.35)]" />
              {/* Hinge notch */}
              <div className="absolute left-1/2 top-0 h-1.5 w-28 -translate-x-1/2 rounded-b-lg bg-[oklch(0.62_0.008_260)] sm:w-36" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
