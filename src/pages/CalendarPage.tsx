import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/ui-extras";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const events = useQuery(api.calendar.getMonthEvents, { year, month });

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().slice(0, 10);

  // Build grid cells (max 42 cells for 6 rows)
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function dateStr(day: number) {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  function eventsForDay(day: number) {
    if (!events) return [];
    const ds = dateStr(day);
    return [
      ...(events.jobs ?? []).filter((e) => e.date === ds),
      ...(events.estimates ?? []).filter((e) => e.date === ds),
      ...(events.reminders ?? []).filter((e) => e.date === ds),
    ];
  }

  const TYPE_COLORS = {
    job: "bg-blue-500/20 text-blue-400",
    estimate: "bg-amber-500/20 text-amber-400",
    maintenance: "bg-green-500/20 text-green-400",
  };

  return (
    <div>
      <PageHeader title="Calendar" description="Jobs, estimates and maintenance due dates">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-36 text-center">
            {MONTHS[month]} {year}
          </span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500/60" />Jobs</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500/60" />Estimates</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500/60" />Maintenance</span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-px">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={i} className="bg-background min-h-[80px] sm:min-h-[100px]" />;
          }
          const ds = dateStr(day);
          const isToday = ds === todayStr;
          const dayEvents = eventsForDay(day);

          return (
            <div
              key={i}
              className={cn(
                "bg-card min-h-[80px] sm:min-h-[100px] p-1.5 flex flex-col",
                isToday && "bg-primary/5"
              )}
            >
              <div className={cn(
                "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 shrink-0",
                isToday
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground"
              )}>
                {day}
              </div>
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={String(ev._id)}
                    className={cn(
                      "rounded px-1 py-0.5 text-[10px] leading-tight truncate",
                      TYPE_COLORS[ev.type as keyof typeof TYPE_COLORS]
                    )}
                  >
                    {ev.label}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming list */}
      {events && (
        <div className="mt-6 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All this month</h2>
          {[...events.jobs, ...events.estimates, ...events.reminders]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((ev) => (
              <div key={String(ev._id)} className="flex items-center gap-3 rounded-md border bg-card px-4 py-2.5">
                <div className={cn("h-2 w-2 rounded-full shrink-0", {
                  "bg-blue-500": ev.type === "job",
                  "bg-amber-500": ev.type === "estimate",
                  "bg-green-500": ev.type === "maintenance",
                })} />
                <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{ev.date}</span>
                <span className="text-sm flex-1 truncate">{ev.label}</span>
                <StatusBadge status={ev.status} />
              </div>
            ))}
          {events.jobs.length + events.estimates.length + events.reminders.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No events this month</p>
          )}
        </div>
      )}
    </div>
  );
}
