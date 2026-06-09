import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { ClipboardList, Wrench, BarChart3, Users } from "lucide-react"

const NAV = [
  { to: "/estimates", label: "Estimates", icon: ClipboardList },
  { to: "/jobs",      label: "Job Cards",  icon: Wrench },
  { to: "/reports",   label: "Reports",    icon: BarChart3 },
  { to: "/team",      label: "Team",       icon: Users },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--color-border)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-brand)] text-white">
            <Wrench className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight text-[var(--color-foreground)]">
            Fiivoo<span className="text-[var(--color-brand-light)]">Mech</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-[var(--color-brand-muted)] text-[var(--color-brand-light)] font-medium"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-foreground)]",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-subtle)]">Demo workspace</p>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-brand)]">
            <Wrench className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="font-semibold text-sm tracking-tight">
            Fiivoo<span className="text-[var(--color-brand-light)]">Mech</span>
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
