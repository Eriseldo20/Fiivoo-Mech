import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wrench, AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary glow-primary">
              <Wrench className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Fiivoo Mech
              </h1>
              <p className="text-sm text-muted-foreground">
                Premium Auto Shop Management
              </p>
            </div>
          </div>

          {/* Error Card */}
          <div className="glass rounded-2xl p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>

            <h2 className="mb-2 text-xl font-semibold">Authentication Error</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Something went wrong during authentication. Please try again.
            </p>

            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/auth/login">Try again</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/sign-up">Create new account</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
