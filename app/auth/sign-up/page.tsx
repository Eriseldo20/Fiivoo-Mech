"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"

export default function SignUpPage() {
  const t = useTranslations("auth")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [dpaAccepted, setDpaAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError(t("passwordsNoMatch"))
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t("passwordTooShort"))
      setIsLoading(false)
      return
    }

    if (!dpaAccepted) {
      setError(t("dpaRequired"))
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            dpa_accepted: true,
            dpa_accepted_at: new Date().toISOString(),
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
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

          {/* Sign Up Card */}
          <div className="glass rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{t("createYourAccount")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("startManaging")}
              </p>
            </div>

            <form onSubmit={handleSignUp} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    {t("firstName")}
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 bg-input/50 border-border/50 focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    {t("lastName")}
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 bg-input/50 border-border/50 focus:border-primary"
                  />
                </div>
              </div>

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

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  {t("confirmPassword")}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 bg-input/50 border-border/50 focus:border-primary"
                />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="dpa"
                  checked={dpaAccepted}
                  onCheckedChange={(checked) => setDpaAccepted(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="dpa" className="text-sm font-normal leading-relaxed text-muted-foreground">
                  {t("dpaAgreePrefix") + " "}
                  <Link
                    href="/legal/dpa"
                    target="_blank"
                    className="font-medium text-primary hover:underline underline-offset-4"
                  >
                    {t("dpaLinkText")}
                  </Link>
                </Label>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full font-medium"
                disabled={isLoading || !dpaAccepted}
              >
                {isLoading ? t("creatingAccount") : t("createAccount")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t("hasAccount") + " "}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                {t("signIn")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
