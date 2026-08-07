"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Boxes, ClipboardList, FileText } from "lucide-react"

export default function LoginPage() {
  const t = useTranslations("auth")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t("genericError"))
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    { icon: Boxes, label: t("featureInventory") },
    { icon: ClipboardList, label: t("featureJobs") },
    { icon: FileText, label: t("featureEstimates") },
  ]

  return (
    <div className="flex min-h-svh w-full">
      {/* Brand panel */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-sidebar-foreground lg:flex"
        style={{
          background:
            "linear-gradient(150deg, oklch(0.17 0.025 250) 0%, oklch(0.13 0.03 255) 55%, oklch(0.10 0.02 245) 100%)",
        }}
      >
        {/* Subtle dot-grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(oklch(0.65 0.15 195) 1px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Accent constellation dots */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute left-[18%] top-[42%] h-2 w-2 rounded-full bg-sidebar-primary" />
          <span className="absolute left-[62%] top-[30%] h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          <span className="absolute left-[74%] top-[46%] h-1.5 w-1.5 rounded-full bg-sidebar-primary/70" />
          <span className="absolute left-[46%] top-[58%] h-1 w-1 rounded-full bg-sidebar-foreground/60" />
          <span className="absolute -right-16 top-10 h-56 w-56 rounded-full border border-sidebar-primary/15" />
          <span className="absolute -left-20 bottom-8 h-64 w-64 rounded-full border border-sidebar-primary/10" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Image
            src="/brand/fiivoo-logo-white.png"
            alt="Fiivoo"
            width={280}
            height={90}
            className="h-14 w-auto object-contain"
            priority
          />
          <span className="text-2xl font-semibold tracking-[0.2em] text-sidebar-primary">
            MECH
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight text-balance">
            {t("loginHeroTitle")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-sidebar-foreground/70 text-pretty">
            {t("loginHeroSubtitle")}
          </p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {features.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-sm border border-sidebar-border/60 bg-sidebar-accent/40 px-4 py-2 text-sm font-medium text-sidebar-foreground/90"
              >
                <Icon className="h-4 w-4 text-sidebar-primary" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-sidebar-foreground/50">
          © {new Date().getFullYear()} Fiivoo Mech
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center p-6 md:p-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center justify-center gap-2.5 lg:hidden">
            <Image
              src="/brand/fiivoo-logo-black.png"
              alt="Fiivoo"
              width={280}
              height={90}
              className="h-12 w-auto object-contain dark:invert"
              priority
            />
            <span className="text-xl font-semibold tracking-[0.2em] text-primary">
              MECH
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("welcomeBack")}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("signInToContinue")}
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t("password")}
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full font-medium"
              disabled={isLoading}
            >
              {isLoading ? t("signingIn") : t("signIn")}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            {t("noAccount") + " "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              {t("createOne")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
