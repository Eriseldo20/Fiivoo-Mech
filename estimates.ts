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

function generateEstimateNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EST-${yy}${mm}-${rand}`;
}

const lineItemValidator = v.object({
  description: v.string(),
  quantity: v.number(),
  unitPrice: v.number(),
  type: v.union(v.literal("labour"), v.literal("part")),
});

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    let estimates = await ctx.db
      .query("estimates")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();
    if (args.status && args.status !== "all") {
      estimates = estimates.filter((e) => e.status === args.status);
    }
    return estimates.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const get = query({
  args: { id: v.id("estimates") },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const estimate = await ctx.db.get(args.id);
    if (!estimate || estimate.shopId !== shopId) return null;
    return estimate;
  },
});

export const create = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    vehicleMake: v.string(),
    vehicleModel: v.string(),
    vehicleYear: v.string(),
    lineItems: v.array(lineItemValidator),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    return await ctx.db.insert("estimates", {
      ...args,
      shopId,
      estimateNumber: generateEstimateNumber(),
      status: "draft",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("estimates"),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    vehicleMake: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    vehicleYear: v.optional(v.string()),
    lineItems: v.optional(v.array(lineItemValidator)),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const estimate = await ctx.db.get(args.id);
    if (!estimate || estimate.shopId !== shopId) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    const { id, status, ...rest } = args;
    const patch: Record<string, unknown> = { ...rest };
    if (status) patch.status = status;
    await ctx.db.patch(id, patch);
  },
});

export const updateStatus = mutation({
  args: { id: v.id("estimates"), status: v.string() },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const estimate = await ctx.db.get(args.id);
    if (!estimate || estimate.shopId !== shopId) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    await ctx.db.patch(args.id, {
      status: args.status as "draft" | "sent" | "accepted" | "declined",
    });
  },
});

export const remove = mutation({
  args: { id: v.id("estimates") },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const estimate = await ctx.db.get(args.id);
    if (!estimate || estimate.shopId !== shopId) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    await ctx.db.delete(args.id);
  },
});

export const convertToJobCard = mutation({
  args: { id: v.id("estimates") },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const estimate = await ctx.db.get(args.id);
    if (!estimate || estimate.shopId !== shopId) throw new ConvexError({ message: "Estimate not found", code: "NOT_FOUND" });

    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(Math.random() * 9000) + 1000;
    const jobNumber = `JC-${yy}${mm}-${rand}`;

    const description = estimate.lineItems
      .map((li) => `${li.description} (x${li.quantity})`)
      .join("; ");

    const jobId = await ctx.db.insert("jobCards", {
      shopId,
      jobNumber,
      customerName: estimate.customerName,
      customerPhone: estimate.customerPhone,
      customerEmail: estimate.customerEmail,
      vehicleMake: estimate.vehicleMake,
      vehicleModel: estimate.vehicleModel,
      vehicleYear: estimate.vehicleYear,
      status: "pending",
      description: description || "Converted from estimate",
      notes: estimate.notes,
      estimatedId: estimate._id,
      photoStorageIds: [],
    });

    await ctx.db.patch(args.id, { status: "accepted", jobCardId: jobId });
    return jobId;
  },
});
