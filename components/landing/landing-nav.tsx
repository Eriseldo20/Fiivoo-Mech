"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
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
          ? "border-b border-[oklch(0.24_0.025_260)] bg-[oklch(0.08_0.02_258)/0.85] backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="Fiivoo home">
          <Image
            src="/brand/fiivoo-logo-white.png"
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
              className="text-sm font-medium text-[oklch(0.72_0.02_260)] transition-colors hover:text-[oklch(0.97_0_0)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-[oklch(0.82_0.02_260)] transition-colors hover:text-[oklch(0.97_0_0)]"
          >
            Log in
          </Link>
          <Link
            href="/auth/sign-up"
            className="rounded-lg bg-[oklch(0.62_0.20_264)] px-4 py-2 text-sm font-semibold text-[oklch(0.99_0_0)] shadow-[0_0_20px_oklch(0.62_0.20_264/0.35)] transition-all hover:bg-[oklch(0.68_0.19_264)] hover:shadow-[0_0_28px_oklch(0.62_0.20_264/0.5)]"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-[oklch(0.9_0_0)] md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-[oklch(0.24_0.025_260)] bg-[oklch(0.08_0.02_258)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[oklch(0.82_0.02_260)] transition-colors hover:bg-[oklch(0.15_0.02_260)] hover:text-[oklch(0.97_0_0)]"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-[oklch(0.24_0.025_260)] pt-3">
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-[oklch(0.9_0_0)] ring-1 ring-[oklch(0.24_0.025_260)]"
              >
                Log in
              </Link>
              <Link
                href="/auth/sign-up"
                className="rounded-lg bg-[oklch(0.62_0.20_264)] px-3 py-2.5 text-center text-sm font-semibold text-[oklch(0.99_0_0)]"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
