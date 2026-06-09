import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { PageHeader, StatCard } from "@/components/ui-extras";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

const PERIODS = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "last_6_months", label: "Last 6 Months" },
  { value: "this_year", label: "This Year" },
  { value: "all", label: "All Time" },
];

const STATUS_COLORS = {
  pending: "#eab308",
  in_progress: "#60a5fa",
  awaiting_parts: "#a78bfa",
  complete: "#4ade80",
  invoiced: "#f97316",
};

export function ReportsPage() {
  const [period, setPeriod] = useState("this_month");
  const report = useQuery(api.reports.getReport, { period });

  if (!report) {
    return (
      <div>
        <PageHeader title="Reports" description="Revenue and job analytics" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statusData = [
    { name: "Pending", value: report.statusBreakdown.pending, color: STATUS_COLORS.pending },
    { name: "In Progress", value: report.statusBreakdown.in_progress, color: STATUS_COLORS.in_progress },
    { name: "Awaiting Parts", value: report.statusBreakdown.awaiting_parts, color: STATUS_COLORS.awaiting_parts },
    { name: "Complete", value: report.statusBreakdown.complete, color: STATUS_COLORS.complete },
    { name: "Invoiced", value: report.statusBreakdown.invoiced, color: STATUS_COLORS.invoiced },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-balance">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Revenue and job analytics</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={formatCurrency(report.totalRevenue)} sub="Completed jobs" />
        <StatCard label="Labour" value={formatCurrency(report.totalLabour)} />
        <StatCard label="Parts" value={formatCurrency(report.totalParts)} />
        <StatCard label="Completed Jobs" value={report.totalJobs} sub={`${report.paidJobs} paid`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Avg Job Value" value={formatCurrency(report.avgJobValue)} />
        <StatCard label="Paid Rate" value={report.totalJobs > 0 ? `${Math.round((report.paidJobs / report.totalJobs) * 100)}%` : "—"} />
      </div>

      {/* Revenue by month */}
      {report.revenueByMonth.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold mb-4">Revenue by Month</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={report.revenueByMonth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
                formatter={(value: number) => [formatCurrency(value), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Status breakdown */}
        {statusData.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold mb-4">Job Status Breakdown</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                    </div>
                    <span className="font-mono font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top employees */}
        {report.topEmployees.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold mb-4">Top Mechanics</h2>
            <div className="space-y-3">
              {report.topEmployees.map((emp, i) => (
                <div key={emp.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.jobs} job{emp.jobs !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-sm font-mono font-semibold text-primary shrink-0">
                    {formatCurrency(emp.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {report.totalJobs === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16">
          <p className="text-sm text-muted-foreground">No completed jobs for the selected period</p>
        </div>
      )}
    </div>
  );
}
