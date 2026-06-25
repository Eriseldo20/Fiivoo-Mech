import Link from "next/link"
import Image from "next/image"

const columns = [
  {
    title: "Produkti",
    links: [
      { label: "Veçoritë", href: "#features" },
      { label: "Çmimet", href: "#pricing" },
      { label: "Pyetjet", href: "#faq" },
    ],
  },
  {
    title: "Llogaria",
    links: [
      { label: "Hyr", href: "/auth/login" },
      { label: "Regjistrohu", href: "/auth/sign-up" },
    ],
  },
  {
    title: "Ligjore",
    links: [{ label: "Marrëveshja e Përpunimit të të Dhënave", href: "/legal/dpa" }],
  },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-[oklch(0.92_0.006_260)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Image
              src="/brand/fiivoo-logo-black.png"
              alt="Fiivoo"
              width={130}
              height={36}
              className="h-8 w-auto object-contain"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[oklch(0.52_0.02_260)]">
              Sistemi operativ modern për servisët e makinave.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-[oklch(0.26_0.03_262)]">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[oklch(0.52_0.02_260)] transition-colors hover:text-[oklch(0.24_0.03_262)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[oklch(0.93_0.006_260)] pt-8 sm:flex-row">
          <p className="text-xs text-[oklch(0.55_0.02_260)]">
            © {new Date().getFullYear()} Fiivoo. Të gjitha të drejtat e rezervuara.
          </p>
          <p className="text-xs text-[oklch(0.55_0.02_260)]">Ndërtuar për servise, kudo.</p>
        </div>
      </div>
    </footer>
  )
}
