import Image from "next/image"
import { Check } from "lucide-react"

const points = [
  "Panel në kohë reale për të ardhurat, punët dhe shpenzimet",
  "Mbështetje shumëgjuhëshe për të gjithë ekipin",
  "Ruajtje e sigurt në cloud, në përputhje me GDPR",
  "Funksionon në çdo pajisje — tavolinë, tablet ose telefon",
]

export function LandingProduct() {
  return (
    <section id="product" className="scroll-mt-20 border-t border-[oklch(0.92_0.006_260)] bg-[oklch(0.98_0.003_260)] py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.55_0.20_264)]">
            Një pamje e qartë
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[oklch(0.22_0.03_262)] sm:text-4xl">
            Dije saktësisht si po performon servisi yt
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-[oklch(0.48_0.02_260)]">
            Mos hamendëso. Fiivoo i kthen aktivitetet e përditshme të servisit në numra dhe tendenca
            të qarta, që të marrësh vendime me besim dhe të rritesh.
          </p>

          <ul className="mt-8 space-y-3.5">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[oklch(0.55_0.20_264)/0.12] text-[oklch(0.55_0.20_264)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm leading-relaxed text-[oklch(0.36_0.02_260)]">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          {/* Browser-window frame with real product screenshot */}
          <div className="overflow-hidden rounded-2xl border border-[oklch(0.90_0.008_260)] bg-white shadow-[0_30px_60px_-25px_oklch(0.22_0.03_262/0.30)]">
            <div className="flex items-center gap-1.5 border-b border-[oklch(0.93_0.006_260)] bg-[oklch(0.98_0.003_260)] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.01_30)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.85_0.04_90)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.80_0.06_150)]" />
            </div>
            <Image
              src="/landing/dashboard-screenshot.png"
              alt="Paneli analitik i Fiivoo"
              width={2560}
              height={1440}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
