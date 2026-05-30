import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";
import type { MutationCtx, QueryCtx } from "./_generated/server";

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

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("employees")
      .withIndex("by_shopId", (q) => q.eq("shopId", user._id))
      .collect()
      .then((all) => all.filter((e) => e.active));
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const shopId = await requireShop(ctx);
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();
    const withJobCount = await Promise.all(
      employees.map(async (e) => {
        const jobs = await ctx.db
          .query("jobCards")
          .withIndex("by_shop_employee", (q) => q.eq("shopId", shopId).eq("assignedEmployeeId", e._id))
          .collect();
        const activeJobs = jobs.filter(
          (j) => j.status !== "complete" && j.status !== "invoiced"
        ).length;
        return { ...e, activeJobCount: activeJobs };
      })
    );
    return withJobCount.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.union(v.literal("mechanic"), v.literal("service_advisor"), v.literal("admin")),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    return await ctx.db.insert("employees", { ...args, shopId, active: true });
  },
});

export const update = mutation({
  args: {
    id: v.id("employees"),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("mechanic"), v.literal("service_advisor"), v.literal("admin"))),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const emp = await ctx.db.get(args.id);
    if (!emp || emp.shopId !== shopId) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const setActive = mutation({
  args: { id: v.id("employees"), active: v.boolean() },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const emp = await ctx.db.get(args.id);
    if (!emp || emp.shopId !== shopId) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    await ctx.db.patch(args.id, { active: args.active });
  },
});

export const remove = mutation({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const emp = await ctx.db.get(args.id);
    if (!emp || emp.shopId !== shopId) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    // Unassign from any job cards first
    const jobs = await ctx.db
      .query("jobCards")
      .withIndex("by_shop_employee", (q) => q.eq("shopId", shopId).eq("assignedEmployeeId", args.id))
      .collect();
    for (const j of jobs) {
      await ctx.db.patch(j._id, { assignedEmployeeId: undefined });
    }
    await ctx.db.delete(args.id);
  },
});
