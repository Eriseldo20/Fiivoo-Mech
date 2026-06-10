import { useState } from "react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Wrench, LoaderCircle, KeyRound } from "lucide-react";

type LoginProps = {
  onSignedIn: (code: string) => void;
};

/**
 * Access-code login for mechanics. Validates the code against Convex before
 * storing it, so an invalid code never enters the "signed in" state.
 */
export function MechanicLogin({ onSignedIn }: LoginProps) {
  const convex = useConvex();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const me = await convex.query(api.mechanic.me, { accessCode: trimmed });
      if (!me) {
        setError("That code isn't valid. Check with your shop owner.");
        return;
      }
      onSignedIn(trimmed);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fiivoo Mech</h1>
          <p className="mt-1 text-sm text-muted-foreground">Technician portal</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="accessCode" className="text-sm font-medium text-foreground">
              Access code
            </label>
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="accessCode"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD-1234"
                autoComplete="one-time-code"
                autoCapitalize="characters"
                spellCheck={false}
                className="w-full rounded-md border border-border bg-card py-3 pl-9 pr-3 font-mono text-lg tracking-widest text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ask your shop owner for your personal access code.
        </p>
      </div>
    </main>
  );
}
