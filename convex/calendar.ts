import { query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const getMonthEvents = query({
  args: {
    year: v.number(),
    month: v.number(), // 0-indexed (0 = January)
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    }

    const shopId = user._id;

    // Month boundaries as UTC timestamps
    const startDate = new Date(Date.UTC(args.year, args.month, 1));
    const endDate = new Date(Date.UTC(args.year, args.month + 1, 0, 23, 59, 59, 999));
    const startTs = startDate.getTime();
    const endTs = endDate.getTime();

    // Date string boundaries for maintenance reminders
    const pad = (n: number) => String(n).padStart(2, "0");
    const startDateStr = `${args.year}-${pad(args.month + 1)}-01`;
    const lastDay = new Date(args.year, args.month + 1, 0).getDate();
    const endDateStr = `${args.year}-${pad(args.month + 1)}-${pad(lastDay)}`;

    const allJobs = await ctx.db
      .query("jobCards")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();

    const allEstimates = await ctx.db
      .query("estimates")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();

    const allReminders = await ctx.db
      .query("maintenanceReminders")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();

    // Filter to current month by _creationTime
    const jobs = allJobs
      .filter((j) => j._creationTime >= startTs && j._creationTime <= endTs)
      .map((j) => ({
        _id: j._id,
        type: "job" as const,
        label: `${j.jobNumber} \u2013 ${j.customerName}`,
        status: j.status,
        date: new Date(j._creationTime).toISOString().slice(0, 10),
      }));

    const estimates = allEstimates
      .filter((e) => e._creationTime >= startTs && e._creationTime <= endTs)
      .map((e) => ({
        _id: e._id,
        type: "estimate" as const,
        label: `${e.estimateNumber} \u2013 ${e.customerName}`,
        status: e.status,
        date: new Date(e._creationTime).toISOString().slice(0, 10),
      }));

    const reminders = allReminders
      .filter((r) => r.dueDate >= startDateStr && r.dueDate <= endDateStr && r.status === "pending")
      .map((r) => ({
        _id: r._id,
        type: "maintenance" as const,
        label: `${r.vehicleYear} ${r.vehicleMake} \u2013 ${r.serviceType.replace(/_/g, " ")}`,
        status: r.status,
        date: r.dueDate,
      }));

    return { jobs, estimates, reminders };
  },
});
