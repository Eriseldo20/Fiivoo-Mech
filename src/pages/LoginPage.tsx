import { useAuth } from "@usehercules/auth/react";
import { Zap, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginPage() {
  const { signin } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Zap className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Fiivoo Mech</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mechanic shop management system
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="rounded-lg border bg-card p-4 space-y-2.5">
          {[
            "Job cards & service history",
            "Estimates & invoicing",
            "Vehicle profiles & photos",
            "Employee management",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Wrench className="h-3.5 w-3.5 shrink-0 text-primary" />
              {feature}
            </div>
          ))}
        </div>

        {/* Sign in */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => signin()}
        >
          Sign in to your shop
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Powered by Fiivoo — workshop management made simple.
        </p>
      </div>
    </div>
  );
}
