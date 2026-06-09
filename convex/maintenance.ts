import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const SERVICE_TYPE_VALIDATOR = v.union(
  v.literal("oil_change"),
  v.literal("tyre_rotation"),
  v.literal("brake_service"),
  v.literal("full_service"),
  v.literal("inspection"),
  v.literal("timing_belt"),
  v.literal("coolant_flush"),
  v.literal("transmission_service"),
  v.literal("other")
);

async function requireShop(ctx: MutationCtx | QueryCtx): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
  return user._id;
}

export const create = mutation({
  args: {
    customerName: v.string(),
    vehicleMake: v.string(),
    vehicleModel: v.string(),
    vehicleYear: v.string(),
    vehicleVin: v.optional(v.string()),
    serviceType: SERVICE_TYPE_VALIDATOR,
    dueDate: v.string(),
    notes: v.optional(v.string()),
    jobCardId: v.optional(v.id("jobCards")),
    estimateId: v.optional(v.id("estimates")),
  },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    return await ctx.db.insert("maintenanceReminders", {
      shopId,
      customerName: args.customerName,
      vehicleMake: args.vehicleMake,
      vehicleModel: args.vehicleModel,
      vehicleYear: args.vehicleYear,
      vehicleVin: args.vehicleVin,
      serviceType: args.serviceType,
      dueDate: args.dueDate,
      notes: args.notes,
      status: "pending",
      jobCardId: args.jobCardId,
      estimateId: args.estimateId,
    });
  },
});

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const all = await ctx.db
      .query("maintenanceReminders")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();
    if (args.status && args.status !== "all") {
      return all.filter((r) => r.status === args.status);
    }
    return all;
  },
});

export const listForMonth = query({
  args: { year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const pad = (n: number) => String(n).padStart(2, "0");
    const startDate = `${args.year}-${pad(args.month + 1)}-01`;
    const lastDay = new Date(args.year, args.month + 1, 0).getDate();
    const endDate = `${args.year}-${pad(args.month + 1)}-${pad(lastDay)}`;

    const all = await ctx.db
      .query("maintenanceReminders")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();

    return all.filter((r) => r.dueDate >= startDate && r.dueDate <= endDate);
  },
});

export const updateStatus = mutation({
  args: {
    reminderId: v.id("maintenanceReminders"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const reminder = await ctx.db.get(args.reminderId);
    if (!reminder || reminder.shopId !== shopId) {
      throw new ConvexError({ message: "Reminder not found", code: "NOT_FOUND" });
    }
    await ctx.db.patch(args.reminderId, { status: args.status });
  },
});

export const remove = mutation({
  args: { reminderId: v.id("maintenanceReminders") },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const reminder = await ctx.db.get(args.reminderId);
    if (!reminder || reminder.shopId !== shopId) {
      throw new ConvexError({ message: "Reminder not found", code: "NOT_FOUND" });
    }
    await ctx.db.delete(args.reminderId);
  },
});
