import { useMemo, useState } from "react";
import { Calendar } from "@/components/calendar";
import type { MonthEvents } from "@/lib/calendar-types";

// Sample data so the calendar renders in preview.
// In the live Convex app, replace this with:
//   const events = useQuery(api.calendar.getMonthEvents, { year, month });
function buildSampleEvents(year: number, month: number): MonthEvents {
  const d = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return {
    jobs: [
      { _id: "j1", type: "job", label: "#1042 – M. Rivera", status: "open", date: d(4) },
      { _id: "j2", type: "job", label: "#1043 – T. Osei", status: "in_progress", date: d(12) },
      { _id: "j3", type: "job", label: "#1044 – L. Andersen", status: "open", date: d(12) },
      { _id: "j4", type: "job", label: "#1045 – K. Park", status: "done", date: d(21) },
    ],
    estimates: [
      { _id: "e1", type: "estimate", label: "EST-220 – J. Cole", status: "sent", date: d(7) },
      { _id: "e2", type: "estimate", label: "EST-221 – B. Singh", status: "draft", date: d(18) },
    ],
    reminders: [
      { _id: "r1", type: "maintenance", label: "2019 Toyota – oil change", status: "pending", date: d(12) },
      { _id: "r2", type: "maintenance", label: "2021 Ford – brake pads", status: "pending", date: d(12) },
      { _id: "r3", type: "maintenance", label: "2018 Honda – tire rotation", status: "pending", date: d(26) },
    ],
  };
}

export function CalendarPage() {
  const now = new Date();
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const events = useMemo(
    () => buildSampleEvents(cursor.year, cursor.month),
    [cursor],
  );

  const shift = (delta: number) => {
    setCursor((c) => {
      const m = c.month + delta;
      const year = c.year + Math.floor(m / 12);
      const month = ((m % 12) + 12) % 12;
      return { year, month };
    });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Calendar
          year={cursor.year}
          month={cursor.month}
          events={events}
          onPrev={() => shift(-1)}
          onNext={() => shift(1)}
          onToday={() =>
            setCursor({ year: now.getFullYear(), month: now.getMonth() })
          }
        />
      </div>
    </main>
  );
}
