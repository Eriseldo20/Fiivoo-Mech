import {
  Wrench,
  LogOut,
  ChevronRight,
  Car,
  ListChecks,
  PenLine,
  LoaderCircle,
  ClipboardList,
} from "lucide-react";
import { useJobs, useMe, type JobId, type JobSummary } from "./data";

type JobListProps = {
  accessCode: string;
  onSignOut: () => void;
  onOpenJob: (id: JobId) => void;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/15 text-primary",
  awaiting_parts: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  complete: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  invoiced: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export function MechanicJobList({ accessCode, onSignOut, onOpenJob }: JobListProps) {
  const me = useMe(accessCode);
  const jobs = useJobs(accessCode);

  const loading = jobs === undefined;
  const activeJobs = jobs?.filter((j) => j.status !== "complete" && j.status !== "invoiced") ?? [];
  const doneJobs = jobs?.filter((j) => j.status === "complete" || j.status === "invoiced") ?? [];

  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="size-5" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">{me?.name ?? "Technician"}</p>
            <p className="text-xs text-muted-foreground">{me?.shopName ?? "Fiivoo Mech"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Sign out</span>
        </button>
      </header>

      <div className="px-4 py-5">
        <h1 className="mb-4 text-lg font-semibold tracking-tight text-foreground">My job cards</h1>

        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
            <ClipboardList className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No jobs assigned to you yet.</p>
          </div>
        )}

        {!loading && activeJobs.length > 0 && (
          <ul className="flex flex-col gap-3">
            {activeJobs.map((job) => (
              <JobRow key={job._id} job={job} onOpen={() => onOpenJob(job._id)} />
            ))}
          </ul>
        )}

        {!loading && doneJobs.length > 0 && (
          <>
            <h2 className="mb-3 mt-7 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed
            </h2>
            <ul className="flex flex-col gap-3">
              {doneJobs.map((job) => (
                <JobRow key={job._id} job={job} onOpen={() => onOpenJob(job._id)} />
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}

function JobRow({ job, onOpen }: { job: JobSummary; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-ring/60"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{job.jobNumber}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[job.status] ?? "bg-muted text-muted-foreground"}`}
            >
              {job.statusLabel}
            </span>
          </div>
          <p className="mt-1.5 truncate font-medium text-foreground">{job.customerName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <Car className="size-3.5 shrink-0" aria-hidden="true" />
            {job.vehicle}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {job.taskCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <ListChecks className="size-3.5" aria-hidden="true" />
                {job.tasksDone}/{job.taskCount} tasks
              </span>
            )}
            {job.hasSignature && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <PenLine className="size-3.5" aria-hidden="true" />
                Signed
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
    </li>
  );
}
