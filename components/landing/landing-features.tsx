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
    title: "Job cards",
    description:
      "Create, assign, and track every repair from check-in to handover with statuses, photos, and priorities.",
  },
  {
    icon: FileText,
    title: "Estimates & invoices",
    description:
      "Build professional estimates in seconds, convert them to jobs, and export branded PDFs your customers trust.",
  },
  {
    icon: Boxes,
    title: "Inventory",
    description:
      "Keep parts and stock levels accurate, with low-stock alerts so you never run dry mid-repair.",
  },
  {
    icon: Users,
    title: "Customers & vehicles",
    description:
      "A complete history for every customer and vehicle — service records, contact details, and reminders.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "See revenue, expenses, and shop performance at a glance with clean, real-time dashboards.",
  },
  {
    icon: Bell,
    title: "Service reminders",
    description:
      "Automatically remind customers when their next service is due and keep your bays booked.",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.70_0.18_264)]">
            Everything in one place
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[oklch(0.97_0_0)] sm:text-4xl">
            Built for the way your shop actually works
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-[oklch(0.72_0.02_260)]">
            Replace the spreadsheets, paper job cards, and scattered notes with one system your whole
            team can rely on.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[oklch(0.22_0.025_260)] bg-[oklch(0.22_0.025_260)] sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-[oklch(0.10_0.02_259)] p-7 transition-colors hover:bg-[oklch(0.13_0.022_260)]"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[oklch(0.62_0.20_264)/0.12] text-[oklch(0.74_0.16_264)] ring-1 ring-inset ring-[oklch(0.62_0.20_264)/0.25] transition-colors group-hover:bg-[oklch(0.62_0.20_264)/0.18]">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[oklch(0.96_0_0)]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[oklch(0.70_0.02_260)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
