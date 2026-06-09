import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const STATUS_MAP = {
  // Job statuses
  pending: { label: "Pending", class: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20" },
  in_progress: { label: "In Progress", class: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  awaiting_parts: { label: "Awaiting Parts", class: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  complete: { label: "Complete", class: "bg-green-500/15 text-green-400 border-green-500/20" },
  invoiced: { label: "Invoiced", class: "bg-primary/15 text-primary border-primary/20" },
  // Estimate statuses
  draft: { label: "Draft", class: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20" },
  sent: { label: "Sent", class: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  accepted: { label: "Accepted", class: "bg-green-500/15 text-green-400 border-green-500/20" },
  declined: { label: "Declined", class: "bg-red-500/15 text-red-400 border-red-500/20" },
  // Maintenance statuses
  cancelled: { label: "Cancelled", class: "bg-red-500/15 text-red-400 border-red-500/20" },
} as const;

type StatusKey = keyof typeof STATUS_MAP;

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status as StatusKey] ?? { label: status, class: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium font-mono",
        config.class,
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground text-balance">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground text-pretty">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  sub?: string;
}

export function StatCard({ label, value, icon, sub }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <span className="text-2xl font-semibold font-mono text-foreground">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}
