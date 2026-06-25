"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Veçoritë", href: "#features" },
  { label: "Produkti", href: "#product" },
  { label: "Kontakti", href: "#pricing" },
  { label: "Pyetjet", href: "#faq" },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-[oklch(0.92_0.006_260)] bg-white/85 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="Fiivoo home">
          <Image
            src="/brand/fiivoo-logo-black.png"
            alt="Fiivoo"
            width={140}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[oklch(0.50_0.02_260)] transition-colors hover:text-[oklch(0.22_0.03_262)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-[oklch(0.40_0.02_260)] transition-colors hover:text-[oklch(0.22_0.03_262)]"
          >
            Hyr
          </Link>
          <Link
            href="/auth/sign-up"
            className="rounded-lg bg-[oklch(0.55_0.20_264)] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_oklch(0.55_0.20_264/0.25)] transition-all hover:bg-[oklch(0.50_0.21_264)]"
          >
            Fillo tani
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-[oklch(0.30_0.02_260)] md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Mbyll menynë" : "Hap menynë"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-[oklch(0.92_0.006_260)] bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[oklch(0.40_0.02_260)] transition-colors hover:bg-[oklch(0.96_0.005_260)] hover:text-[oklch(0.22_0.03_262)]"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-[oklch(0.92_0.006_260)] pt-3">
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-[oklch(0.30_0.02_260)] ring-1 ring-[oklch(0.90_0.006_260)]"
              >
                Hyr
              </Link>
              <Link
                href="/auth/sign-up"
                className="rounded-lg bg-[oklch(0.55_0.20_264)] px-3 py-2.5 text-center text-sm font-semibold text-white"
              >
                Fillo tani
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
