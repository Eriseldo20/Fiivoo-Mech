import { query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel.d.ts";
import type { QueryCtx } from "./_generated/server";

async function requireShop(ctx: QueryCtx): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
  return user._id;
}

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  type: "labour" | "part";
};

export const getReport = query({
  args: {
    period: v.string(),
  },
  handler: async (ctx, args): Promise<{
    totalRevenue: number;
    totalLabour: number;
    totalParts: number;
    totalJobs: number;
    paidJobs: number;
    avgJobValue: number;
    revenueByMonth: { label: string; revenue: number; jobs: number }[];
    topEmployees: { name: string; jobs: number; revenue: number }[];
    statusBreakdown: { pending: number; in_progress: number; awaiting_parts: number; complete: number; invoiced: number };
  }> => {
    const shopId = await requireShop(ctx);

    const now = new Date();
    let startMs: number | null = null;
    let endMs: number = now.getTime();

    if (args.period === "this_month") {
      startMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    } else if (args.period === "last_month") {
      startMs = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      endMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime() - 1;
    } else if (args.period === "last_3_months") {
      startMs = new Date(now.getFullYear(), now.getMonth() - 3, 1).getTime();
    } else if (args.period === "last_6_months") {
      startMs = new Date(now.getFullYear(), now.getMonth() - 6, 1).getTime();
    } else if (args.period === "this_year") {
      startMs = new Date(now.getFullYear(), 0, 1).getTime();
    }

    const allJobs: Doc<"jobCards">[] = await ctx.db
      .query("jobCards")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();

    const completedJobs = allJobs.filter(
      (j) =>
        (j.status === "complete" || j.status === "invoiced") &&
        (startMs === null || j._creationTime >= startMs) &&
        j._creationTime <= endMs
    );

    const jobsWithRevenue = await Promise.all(
      completedJobs.map(async (j) => {
        const estimate = j.estimatedId ? await ctx.db.get(j.estimatedId) : null;
        const items: LineItem[] = (estimate?.lineItems ?? []) as LineItem[];
        const revenue = items.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
        const labourRevenue = items
          .filter((li) => li.type === "labour")
          .reduce((s, li) => s + li.quantity * li.unitPrice, 0);
        const partsRevenue = items
          .filter((li) => li.type === "part")
          .reduce((s, li) => s + li.quantity * li.unitPrice, 0);
        return { ...j, revenue, labourRevenue, partsRevenue };
      })
    );

    const totalRevenue = jobsWithRevenue.reduce((s, j) => s + j.revenue, 0);
    const totalLabour = jobsWithRevenue.reduce((s, j) => s + j.labourRevenue, 0);
    const totalParts = jobsWithRevenue.reduce((s, j) => s + j.partsRevenue, 0);
    const totalJobs = jobsWithRevenue.length;
    const paidJobs = jobsWithRevenue.filter((j) => j.paid).length;
    const avgJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;

    const monthMap: Record<string, { label: string; revenue: number; jobs: number }> = {};
    for (const j of jobsWithRevenue) {
      const d = new Date(j._creationTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
      if (!monthMap[key]) monthMap[key] = { label, revenue: 0, jobs: 0 };
      monthMap[key].revenue += j.revenue;
      monthMap[key].jobs += 1;
    }
    const revenueByMonth = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, val]) => val);

    const employeeMap: Record<string, { name: string; jobs: number; revenue: number }> = {};
    for (const j of jobsWithRevenue) {
      if (!j.assignedEmployeeId) continue;
      const id = j.assignedEmployeeId as string;
      if (!employeeMap[id]) {
        const emp = await ctx.db.get(j.assignedEmployeeId);
        employeeMap[id] = { name: emp?.name ?? "Unknown", jobs: 0, revenue: 0 };
      }
      employeeMap[id].jobs += 1;
      employeeMap[id].revenue += j.revenue;
    }
    const topEmployees = Object.values(employeeMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const periodJobs = allJobs.filter(
      (j) => startMs === null || j._creationTime >= startMs
    );
    const statusBreakdown = {
      pending: periodJobs.filter((j) => j.status === "pending").length,
      in_progress: periodJobs.filter((j) => j.status === "in_progress").length,
      awaiting_parts: periodJobs.filter((j) => j.status === "awaiting_parts").length,
      complete: periodJobs.filter((j) => j.status === "complete").length,
      invoiced: periodJobs.filter((j) => j.status === "invoiced").length,
    };

    return {
      totalRevenue,
      totalLabour,
      totalParts,
      totalJobs,
      paidJobs,
      avgJobValue,
      revenueByMonth,
      topEmployees,
      statusBreakdown,
    };
  },
});
