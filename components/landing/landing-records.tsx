import Image from "next/image"
import { Camera, FileClock, CheckCircle2 } from "lucide-react"

const points = [
  {
    icon: Camera,
    title: "Fotografo në vend",
    text: "Kap gjendjen e automjetit direkt nga telefoni—goma, dëmtime apo pjesë—pa fletore dhe pa vonesa.",
  },
  {
    icon: FileClock,
    title: "Historik i plotë",
    text: "Çdo foto dhe shënim ruhet automatikisht në kartelën e automjetit, gati për t'u parë kurdo.",
  },
  {
    icon: CheckCircle2,
    title: "Gjithçka nën kontroll",
    text: "Nga kamioni i madh te makina e klientit—mbaj evidencë të saktë dhe profesionale për çdo punë.",
  },
]

export function LandingRecords() {
  return (
    <section className="scroll-mt-20 border-t border-[oklch(0.92_0.006_260)] bg-[oklch(0.98_0.003_260)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.55_0.20_264)]">
            Mbajtja e të dhënave
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[oklch(0.22_0.03_262)] sm:text-4xl">
            Tani është më e lehtë se kurrë të mbash shënime
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-[oklch(0.48_0.02_260)]">
            Nga automjetet e mëdha komerciale te makinat e përditshme, dokumento çdo detaj me një foto
            dhe ruaj historikun e plotë të shërbimit—direkt nga vendi i punës.
          </p>
        </div>

        {/* Image showcase */}
        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-5">
          {/* Volvo - large */}
          <div className="relative overflow-hidden rounded-3xl border border-[oklch(0.92_0.006_260)] bg-white shadow-[0_30px_60px_-30px_oklch(0.20_0.03_262/0.25)] lg:col-span-3">
            <Image
              src="/landing/volvo-truck.avif"
              alt="Kamion Volvo FH Aero i regjistruar në Fiivoo"
              width={1600}
              height={1000}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[oklch(0.18_0.04_262/0.85)] to-transparent p-6 pt-16">
              <p className="text-sm font-semibold text-white">Automjete komerciale</p>
              <p className="text-xs text-[oklch(0.85_0.02_260)]">Regjistro flotën e plotë me VIN, targë dhe foto.</p>
            </div>
          </div>

          {/* iPhone photographing wheel */}
          <div className="relative overflow-hidden rounded-3xl border border-[oklch(0.92_0.006_260)] bg-white shadow-[0_30px_60px_-30px_oklch(0.20_0.03_262/0.25)] lg:col-span-2">
            <Image
              src="/landing/iphone-wheel.png"
              alt="Fotografimi i gomës së automjetit me telefon për dokumentim"
              width={1200}
              height={1200}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[oklch(0.18_0.04_262/0.85)] to-transparent p-6 pt-16">
              <p className="text-sm font-semibold text-white">Foto direkt nga vendi</p>
              <p className="text-xs text-[oklch(0.85_0.02_260)]">Kap gjendjen e gomave dhe dëmtimet në sekonda.</p>
            </div>
          </div>
        </div>

        {/* Supporting points */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {points.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-[oklch(0.92_0.006_260)] bg-white p-6 shadow-[0_10px_30px_-20px_oklch(0.20_0.03_262/0.3)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.55_0.20_264)/0.10] text-[oklch(0.50_0.20_264)]">
                <point.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[oklch(0.22_0.03_262)]">{point.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[oklch(0.48_0.02_260)]">{point.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
