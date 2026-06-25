import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function LandingCta() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[oklch(0.18_0.03_262)] px-6 py-14 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, oklch(0.55 0.20 264 / 0.45) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Gati të modernizosh servisin tënd?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-[oklch(0.82_0.02_260)]">
            Bashkohu me servisët që tashmë punojnë më mirë me Fiivoo. Fillo brenda minutash — falas.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/sign-up"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[oklch(0.62_0.20_264)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_28px_oklch(0.62_0.20_264/0.45)] transition-all hover:bg-[oklch(0.68_0.19_264)] sm:w-auto"
            >
              Fillo falas sot
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center rounded-xl px-7 py-3.5 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/10 sm:w-auto"
            >
              Hyr
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
