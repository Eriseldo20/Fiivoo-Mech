// Types mirror the return shape of the Convex query `calendar.getMonthEvents`.
export type CalendarEventType = "job" | "estimate" | "maintenance";

export interface CalendarEvent {
  _id: string;
  type: CalendarEventType;
  label: string;
  status: string;
  date: string; // "YYYY-MM-DD"
}

export interface MonthEvents {
  jobs: CalendarEvent[];
  estimates: CalendarEvent[];
  reminders: CalendarEvent[];
}

export const EVENT_META: Record<
  CalendarEventType,
  { label: string; abbr: string }
> = {
  job: { label: "Job Card", abbr: "JOB" },
  estimate: { label: "Estimate", abbr: "EST" },
  maintenance: { label: "Maintenance", abbr: "MNT" },
};
