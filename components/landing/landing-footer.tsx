import Link from "next/link"
import Image from "next/image"

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/auth/login" },
      { label: "Sign up", href: "/auth/sign-up" },
    ],
  },
  {
    title: "Legal",
    links: [{ label: "Data Processing Agreement", href: "/legal/dpa" }],
  },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-[oklch(0.20_0.025_260)] bg-[oklch(0.06_0.015_256)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Image
              src="/brand/fiivoo-logo-white.png"
              alt="Fiivoo"
              width={130}
              height={36}
              className="h-8 w-auto object-contain"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[oklch(0.62_0.02_260)]">
              The modern operating system for auto repair shops.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-[oklch(0.90_0_0)]">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[oklch(0.64_0.02_260)] transition-colors hover:text-[oklch(0.92_0_0)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[oklch(0.18_0.02_258)] pt-8 sm:flex-row">
          <p className="text-xs text-[oklch(0.55_0.02_260)]">
            © {new Date().getFullYear()} Fiivoo. All rights reserved.
          </p>
          <p className="text-xs text-[oklch(0.55_0.02_260)]">Built for workshops, everywhere.</p>
        </div>
      </div>
    </footer>
  )
}
