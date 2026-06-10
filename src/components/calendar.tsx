import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Briefcase, FileText, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CalendarEvent,
  type CalendarEventType,
  type MonthEvents,
} from "@/lib/calendar-types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TYPE_ICON: Record<CalendarEventType, typeof Briefcase> = {
  job: Briefcase,
  estimate: FileText,
  maintenance: Wrench,
};

const TYPE_ABBR: Record<CalendarEventType, string> = {
  job: "JOB",
  estimate: "EST",
  maintenance: "MNT",
};

interface CalendarProps {
  year: number;
  month: number; // 0-indexed
  events: MonthEvents;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

interface DayCell {
  date: Date;
  inMonth: boolean;
  iso: string;
  events: CalendarEvent[];
}

function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function Calendar({
  year,
  month,
  events,
  onPrev,
  onNext,
  onToday,
}: CalendarProps) {
  const allEvents = useMemo(
    () => [...events.jobs, ...events.estimates, ...events.reminders],
    [events],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of allEvents) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [allEvents]);

  const cells = useMemo<DayCell[]>(() => {
    const firstOfMonth = new Date(year, month, 1);
    // Make Monday the first column (getDay: 0=Sun..6=Sat)
    const offset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - offset);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + i,
      );
      const iso = toIso(date);
      return {
        date,
        inMonth: date.getMonth() === month,
        iso,
        events: eventsByDay.get(iso) ?? [],
      };
    });
  }, [year, month, eventsByDay]);

  const todayIso = toIso(new Date());

  return (
    <section className="w-full font-sans text-foreground">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-foreground pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Schedule
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {MONTH_NAMES[month]}{" "}
            <span className="text-muted-foreground">{year}</span>
          </h1>
        </div>

        <div className="flex w-fit items-stretch gap-px self-start bg-foreground">
          <button
            type="button"
            onClick={onToday}
            className="bg-background px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous month"
            className="flex items-center bg-background px-3 py-2 transition-colors hover:bg-foreground hover:text-background"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next month"
            className="flex items-center bg-background px-3 py-2 transition-colors hover:bg-foreground hover:text-background"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Weekday row */}
      <div className="mt-5 grid grid-cols-7 gap-px border border-foreground bg-foreground">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="bg-background py-2 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px border-x border-b border-foreground bg-foreground">
        {cells.map((cell) => {
          const isToday = cell.iso === todayIso;
          return (
            <div
              key={cell.iso}
              className={cn(
                "relative flex aspect-square flex-col bg-background p-1.5 sm:p-2",
                !cell.inMonth && "bg-muted/40 text-muted-foreground",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    isToday &&
                      "flex h-5 w-5 items-center justify-center bg-foreground text-background",
                    !cell.inMonth && "opacity-50",
                  )}
                >
                  {cell.date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="mt-1 flex flex-1 flex-col gap-px overflow-hidden">
                {cell.events.slice(0, 3).map((e) => {
                  const Icon = TYPE_ICON[e.type];
                  return (
                    <div
                      key={e._id}
                      title={`${TYPE_ABBR[e.type]} · ${e.label} · ${e.status}`}
                      className="flex items-center gap-1 border border-foreground bg-background px-1 py-0.5"
                    >
                      <Icon className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate text-[10px] leading-tight">
                        <span className="hidden sm:inline">{e.label}</span>
                        <span className="font-mono sm:hidden">
                          {TYPE_ABBR[e.type]}
                        </span>
                      </span>
                    </div>
                  );
                })}
                {cell.events.length > 3 && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    +{cell.events.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <footer className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-foreground pt-4">
        {(["job", "estimate", "maintenance"] as CalendarEventType[]).map(
          (type) => {
            const Icon = TYPE_ICON[type];
            const labels: Record<CalendarEventType, string> = {
              job: "Job Cards",
              estimate: "Estimates",
              maintenance: "Maintenance",
            };
            return (
              <div key={type} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center border border-foreground">
                  <Icon className="h-3 w-3" />
                </span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {labels[type]}
                </span>
              </div>
            );
          },
        )}
      </footer>
    </section>
  );
}
