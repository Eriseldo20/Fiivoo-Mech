import Link from "next/link"
import { Check, Sparkles } from "lucide-react"

const benefits = [
  "30 ditë provë falas, pa kartë krediti",
  "Kartela pune & preventiva të pakufizuara",
  "Inventar, analitika & kujtesa shërbimi",
  "Të dhëna klientësh & automjetesh",
  "Përdorues të shumtë për ekipin tënd",
  "Mbështetje dhe trajnim i personalizuar",
]

export function LandingPricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-[oklch(0.92_0.006_260)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.55_0.20_264)]">
            Çmime të personalizuara
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[oklch(0.22_0.03_262)] sm:text-4xl">
            Çmim i përshtatur për servisin tënd
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-[oklch(0.48_0.02_260)]">
            Çdo servis është i ndryshëm. Na kontakto për një ofertë të personalizuar dhe fillo me 30 ditë provë falas.
          </p>
        </div>

        <div
          className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-3xl border bg-white shadow-[0_30px_60px_-25px_oklch(0.55_0.20_264/0.30)]"
          style={{ borderColor: "oklch(0.55 0.20 264 / 0.25)" }}
        >
          <div className="grid gap-0 md:grid-cols-5">
            {/* Highlight panel */}
            <div
              className="flex flex-col justify-center gap-3 p-8 md:col-span-2"
              style={{ background: "oklch(0.18 0.04 262)" }}
            >
              <span
                className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-[oklch(0.85_0.10_264)]"
                style={{ background: "oklch(0.55 0.20 264 / 0.20)" }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Provë falas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight text-white">30</span>
                <span className="text-lg font-medium text-[oklch(0.78_0.02_260)]">ditë</span>
              </div>
              <p className="text-sm leading-relaxed text-[oklch(0.75_0.02_260)]">
                Provoje Fiivoo plotësisht falas për 30 ditë. Pa kartë krediti, pa angazhim.
              </p>
            </div>

            {/* Benefits + CTA */}
            <div className="flex flex-col p-8 md:col-span-3">
              <ul className="grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.55_0.20_264)]" />
                    <span className="text-sm leading-relaxed text-[oklch(0.40_0.02_260)]">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[oklch(0.55_0.20_264)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_oklch(0.55_0.20_264/0.3)] transition-all hover:bg-[oklch(0.50_0.21_264)]"
                >
                  Fillo provën falas
                </Link>
                <Link
                  href="mailto:shitje@fiivoo.com"
                  className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-[oklch(0.28_0.02_260)] ring-1 ring-[oklch(0.88_0.008_260)] transition-all hover:bg-[oklch(0.97_0.005_260)]"
                >
                  Na kontakto
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
