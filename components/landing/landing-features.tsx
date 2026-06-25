import {
  ClipboardList,
  FileText,
  Boxes,
  Users,
  BarChart3,
  Bell,
} from "lucide-react"

const features = [
  {
    icon: ClipboardList,
    title: "Kartelat e punës",
    description:
      "Krijo, cakto dhe ndiq çdo riparim nga pranimi te dorëzimi, me statuse, foto dhe prioritete.",
  },
  {
    icon: FileText,
    title: "Preventivat & faturat",
    description:
      "Ndërto preventiva profesionale në sekonda, kthei në punë dhe eksporto PDF me markën tënde.",
  },
  {
    icon: Boxes,
    title: "Inventari",
    description:
      "Mbaj pjesët dhe nivelet e stokut të sakta, me njoftime për stok të ulët që të mos mbetesh pa pjesë.",
  },
  {
    icon: Users,
    title: "Klientët & automjetet",
    description:
      "Një histori e plotë për çdo klient dhe automjet — të dhënat e shërbimit, kontaktet dhe kujtesat.",
  },
  {
    icon: BarChart3,
    title: "Analitika",
    description:
      "Shiko të ardhurat, shpenzimet dhe performancën e servisit me një vështrim, në kohë reale.",
  },
  {
    icon: Bell,
    title: "Kujtesat e shërbimit",
    description:
      "Kujto automatikisht klientët kur u afrohet shërbimi i radhës dhe mbaj boksat të zëna.",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.55_0.20_264)]">
            Gjithçka në një vend
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[oklch(0.22_0.03_262)] sm:text-4xl">
            Ndërtuar për mënyrën si punon servisi yt
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-[oklch(0.48_0.02_260)]">
            Zëvendëso tabelat, kartelat e punës në letër dhe shënimet e shpërndara me një sistem të
            vetëm të cilit i besohet i gjithë ekipi.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[oklch(0.92_0.006_260)] bg-[oklch(0.92_0.006_260)] sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-white p-7 transition-colors hover:bg-[oklch(0.98_0.003_260)]"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[oklch(0.55_0.20_264)/0.10] text-[oklch(0.55_0.20_264)] ring-1 ring-inset ring-[oklch(0.55_0.20_264)/0.18] transition-colors group-hover:bg-[oklch(0.55_0.20_264)/0.16]">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[oklch(0.24_0.03_262)]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[oklch(0.50_0.02_260)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
