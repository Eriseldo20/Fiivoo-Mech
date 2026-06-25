import Link from "next/link"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Fillestar",
    price: "0€",
    period: "/muaj",
    description: "Për mekanikë solo që duan organizim.",
    features: ["Deri në 30 kartela pune/muaj", "Preventiva & eksport PDF", "Të dhëna klientësh & automjetesh", "1 përdorues"],
    cta: "Fillo falas",
    featured: false,
  },
  {
    name: "Servisi",
    price: "49€",
    period: "/muaj",
    description: "Për servise në rritje që duan të gjitha mjetet.",
    features: [
      "Kartela pune të pakufizuara",
      "Inventar & njoftime stoku",
      "Panel analitik",
      "Kujtesa shërbimi",
      "Deri në 10 përdorues",
    ],
    cta: "Fillo provën falas",
    featured: true,
  },
  {
    name: "Biznes",
    price: "Personalizuar",
    period: "",
    description: "Për biznese me shumë lokacione.",
    features: ["Gjithçka te Servisi", "Lokacione të shumta", "Mbështetje me prioritet", "Trajnim i personalizuar"],
    cta: "Kontakto shitjet",
    featured: false,
  },
]

export function LandingPricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-[oklch(0.92_0.006_260)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.55_0.20_264)]">
            Çmime të thjeshta
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[oklch(0.22_0.03_262)] sm:text-4xl">
            Plane që rriten me servisin tënd
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-[oklch(0.48_0.02_260)]">
            Fillo falas dhe përmirëso kur je gati. Pa kontrata, anulo në çdo kohë.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-7",
                plan.featured
                  ? "border-[oklch(0.55_0.20_264)/0.45] bg-white shadow-[0_24px_50px_-20px_oklch(0.55_0.20_264/0.30)] ring-1 ring-[oklch(0.55_0.20_264)/0.20]"
                  : "border-[oklch(0.92_0.006_260)] bg-white",
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-[oklch(0.55_0.20_264)] px-3 py-1 text-xs font-semibold text-white">
                  Më i popullarizuari
                </span>
              )}
              <h3 className="text-lg font-semibold text-[oklch(0.24_0.03_262)]">{plan.name}</h3>
              <p className="mt-1 text-sm text-[oklch(0.52_0.02_260)]">{plan.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-[oklch(0.20_0.03_262)]">
                  {plan.price}
                </span>
                <span className="text-sm text-[oklch(0.55_0.02_260)]">{plan.period}</span>
              </div>

              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.55_0.20_264)]" />
                    <span className="text-sm leading-relaxed text-[oklch(0.40_0.02_260)]">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/sign-up"
                className={cn(
                  "mt-8 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all",
                  plan.featured
                    ? "bg-[oklch(0.55_0.20_264)] text-white shadow-[0_12px_28px_oklch(0.55_0.20_264/0.3)] hover:bg-[oklch(0.50_0.21_264)]"
                    : "text-[oklch(0.28_0.02_260)] ring-1 ring-[oklch(0.88_0.008_260)] hover:bg-[oklch(0.97_0.005_260)]",
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
