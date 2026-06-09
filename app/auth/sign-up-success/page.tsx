import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wrench, Mail } from "lucide-react"

export default function SignUpSuccessPage() {
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

          {/* Success Card */}
          <div className="glass rounded-2xl p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Mail className="h-8 w-8 text-success" />
            </div>

            <h2 className="mb-2 text-xl font-semibold">Check your email</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {"We've sent you a confirmation link. Please check your inbox and click the link to verify your account."}
            </p>

            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">Back to login</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
