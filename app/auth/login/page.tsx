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

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/brand/fiivoo-logo-black.png"
              alt="Fiivoo"
              width={200}
              height={64}
              className="h-12 w-auto object-contain dark:invert"
              priority
            />
            <p className="text-sm text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          {/* Login Card */}
          <div className="glass rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{t("welcomeBack")}</h2>
              <p className="text-sm text-muted-foreground">
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
                  className="h-11 bg-input/50 border-border/50 focus:border-primary"
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
                  className="h-11 bg-input/50 border-border/50 focus:border-primary"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
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

            <div className="mt-6 text-center text-sm text-muted-foreground">
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
    </div>
  )
}
