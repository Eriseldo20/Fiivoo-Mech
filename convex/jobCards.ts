import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel.d.ts";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function generateJobNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `JC-${yy}${mm}-${rand}`;
}

/** Upsert vehicle profile scoped to shop. Returns vehicleId. */
async function upsertVehicle(
  ctx: MutationCtx,
  shopId: Id<"users">,
  vin: string,
  make: string,
  model: string,
  year: string
): Promise<Id<"vehicles">> {
  const normalVin = vin.trim().toUpperCase();
  const existing = await ctx.db
    .query("vehicles")
    .withIndex("by_shop_vin", (q) => q.eq("shopId", shopId).eq("vin", normalVin))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { make, model, year });
    return existing._id;
  }
  return await ctx.db.insert("vehicles", { shopId, vin: normalVin, make, model, year, photoStorageIds: [] });
}

// ── Queries ───────────────────────────────────────────────────────────────────

export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    let jobs = await ctx.db
      .query("jobCards")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();
    if (args.status && args.status !== "all") {
      jobs = jobs.filter((j) => j.status === args.status);
    }
    const withEmployee = await Promise.all(
      jobs.map(async (j) => {
        const employee = j.assignedEmployeeId
          ? await ctx.db.get(j.assignedEmployeeId)
          : null;
        const estimate = j.estimatedId ? await ctx.db.get(j.estimatedId) : null;
        const totalCharge = estimate
          ? estimate.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0)
          : null;
        return { ...j, employeeName: employee?.name ?? null, totalCharge };
      })
    );
    return withEmployee.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const get = query({
  args: { id: v.id("jobCards") },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const job = await ctx.db.get(args.id);
    if (!job || job.shopId !== shopId) return null;
    const employee = job.assignedEmployeeId
      ? await ctx.db.get(job.assignedEmployeeId)
      : null;

    // Vehicle photos — from shared vehicle profile if VIN present
    let vehicleId: Id<"vehicles"> | null = null;
    let photoUrls: { storageId: string; url: string | null }[] = [];
    if (job.vehicleVin) {
      const vin = job.vehicleVin.trim().toUpperCase();
      const vehicle = await ctx.db
        .query("vehicles")
        .withIndex("by_shop_vin", (q) => q.eq("shopId", shopId).eq("vin", vin))
        .unique();
      if (vehicle) {
        vehicleId = vehicle._id;
        photoUrls = await Promise.all(
          vehicle.photoStorageIds.map(async (sid) => ({
            storageId: sid,
            url: await ctx.storage.getUrl(sid as Id<"_storage">),
          }))
        );
      }
    } else {
      // Fallback for legacy records without VIN
      photoUrls = await Promise.all(
        (job.photoStorageIds ?? []).map(async (sid) => ({
          storageId: sid,
          url: await ctx.storage.getUrl(sid as Id<"_storage">),
        }))
      );
    }

    const tasks = await ctx.db
      .query("jobTasks")
      .withIndex("by_job", (q) => q.eq("jobCardId", args.id))
      .collect();

    // Cross-job history: all service records for every job sharing this VIN within this shop
    type HistoryEntry = {
      _id: Id<"serviceHistory">;
      _creationTime: number;
      jobCardId: Id<"jobCards">;
      odometerKm: number;
      description: string;
      type: string;
      jobNumber?: string;
    };
    let history: HistoryEntry[] = [];
    if (job.vehicleVin) {
      const vin = job.vehicleVin.trim().toUpperCase();
      const shopJobs = await ctx.db
        .query("jobCards")
        .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
        .collect();
      const vinJobs = shopJobs.filter(
        (j) => j.vehicleVin && j.vehicleVin.trim().toUpperCase() === vin
      );
      const allArrays = await Promise.all(
        vinJobs.map(async (j) => {
          const entries = await ctx.db
            .query("serviceHistory")
            .withIndex("by_job", (q) => q.eq("jobCardId", j._id))
            .collect();
          return entries.map((e) => ({ ...e, jobNumber: j.jobNumber }));
        })
      );
      history = allArrays.flat().sort((a, b) => b.odometerKm - a.odometerKm);
    } else {
      const entries = await ctx.db
        .query("serviceHistory")
        .withIndex("by_job", (q) => q.eq("jobCardId", args.id))
        .order("desc")
        .collect();
      history = entries;
    }

    const estimate = job.estimatedId ? await ctx.db.get(job.estimatedId) : null;
    return { ...job, employee, vehicleId, photoUrls, tasks, history, estimate };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    vehicleMake: v.string(),
    vehicleModel: v.string(),
    vehicleYear: v.string(),
    vehicleVin: v.string(),
    vehicleOdometer: v.optional(v.string()),
    assignedEmployeeId: v.optional(v.id("employees")),
    description: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    await upsertVehicle(ctx, shopId, args.vehicleVin, args.vehicleMake, args.vehicleModel, args.vehicleYear);
    const id = await ctx.db.insert("jobCards", {
      ...args,
      shopId,
      jobNumber: generateJobNumber(),
      status: "pending",
      photoStorageIds: [],
    });
    await ctx.db.insert("serviceHistory", {
      jobCardId: id,
      odometerKm: args.vehicleOdometer ? Number(args.vehicleOdometer.replace(/,/g, "")) : 0,
      description: "Job card created — " + args.description,
      type: "general",
    });
    return id;
  },
});

export const togglePaid = mutation({
  args: { id: v.id("jobCards"), paid: v.boolean() },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const job = await ctx.db.get(args.id);
    if (!job || job.shopId !== shopId) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    await ctx.db.patch(args.id, { paid: args.paid });
  },
});

export const updateStatus = mutation({
  args: { id: v.id("jobCards"), status: v.string() },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const job = await ctx.db.get(args.id);
    if (!job || job.shopId !== shopId) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    await ctx.db.patch(args.id, { status: args.status as "pending" | "in_progress" | "awaiting_parts" | "complete" | "invoiced" });
  },
});

export const update = mutation({
  args: {
    id: v.id("jobCards"),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    vehicleMake: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    vehicleYear: v.optional(v.string()),
    vehicleVin: v.optional(v.string()),
    vehicleOdometer: v.optional(v.string()),
    assignedEmployeeId: v.optional(v.id("employees")),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const job = await ctx.db.get(args.id);
    if (!job || job.shopId !== shopId) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    const { id, status, vehicleVin, vehicleMake, vehicleModel, vehicleYear, ...rest } = args;
    const patch: Record<string, unknown> = { ...rest };
    if (status) patch.status = status;
    if (vehicleVin) patch.vehicleVin = vehicleVin;
    if (vehicleMake) patch.vehicleMake = vehicleMake;
    if (vehicleModel) patch.vehicleModel = vehicleModel;
    if (vehicleYear) patch.vehicleYear = vehicleYear;
    if (vehicleVin && vehicleMake && vehicleModel && vehicleYear) {
      await upsertVehicle(ctx, shopId, vehicleVin, vehicleMake, vehicleModel, vehicleYear);
    }
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("jobCards") },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const job = await ctx.db.get(args.id);
    if (!job || job.shopId !== shopId) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    const tasks = await ctx.db.query("jobTasks").withIndex("by_job", (q) => q.eq("jobCardId", args.id)).collect();
    for (const t of tasks) await ctx.db.delete(t._id);
    const history = await ctx.db.query("serviceHistory").withIndex("by_job", (q) => q.eq("jobCardId", args.id)).collect();
    for (const h of history) await ctx.db.delete(h._id);
    await ctx.db.delete(args.id);
  },
});

// ── Photo upload (kept for legacy) ────────────────────────────────────────────

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireShop(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const addPhoto = mutation({
  args: { id: v.id("jobCards"), storageId: v.string() },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const job = await ctx.db.get(args.id);
    if (!job || job.shopId !== shopId) throw new ConvexError({ message: "Job not found", code: "NOT_FOUND" });
    const existing = job.photoStorageIds ?? [];
    await ctx.db.patch(args.id, { photoStorageIds: [...existing, args.storageId] });
  },
});

export const removePhoto = mutation({
  args: { id: v.id("jobCards"), storageId: v.string() },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const job = await ctx.db.get(args.id);
    if (!job || job.shopId !== shopId) throw new ConvexError({ message: "Job not found", code: "NOT_FOUND" });
    await ctx.storage.delete(args.storageId as Id<"_storage">);
    await ctx.db.patch(args.id, {
      photoStorageIds: (job.photoStorageIds ?? []).filter((s) => s !== args.storageId),
    });
  },
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const addTask = mutation({
  args: { jobCardId: v.id("jobCards"), title: v.string() },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const job = await ctx.db.get(args.jobCardId);
    if (!job || job.shopId !== shopId) throw new ConvexError({ message: "Job not found", code: "NOT_FOUND" });
    return await ctx.db.insert("jobTasks", { jobCardId: args.jobCardId, title: args.title, completed: false });
  },
});

export const toggleTask = mutation({
  args: { taskId: v.id("jobTasks"), completed: v.boolean() },
  handler: async (ctx, args) => {
    await requireShop(ctx);
    await ctx.db.patch(args.taskId, { completed: args.completed });
  },
});

export const removeTask = mutation({
  args: { taskId: v.id("jobTasks") },
  handler: async (ctx, args) => {
    await requireShop(ctx);
    await ctx.db.delete(args.taskId);
  },
});

// ── Service History ───────────────────────────────────────────────────────────

export const addHistoryEntry = mutation({
  args: {
    jobCardId: v.id("jobCards"),
    odometerKm: v.number(),
    description: v.string(),
    type: v.union(
      v.literal("general"),
      v.literal("oil_change"),
      v.literal("tyre"),
      v.literal("brake"),
      v.literal("service"),
      v.literal("repair"),
      v.literal("inspection")
    ),
  },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const job = await ctx.db.get(args.jobCardId);
    if (!job || job.shopId !== shopId) throw new ConvexError({ message: "Job not found", code: "NOT_FOUND" });
    return await ctx.db.insert("serviceHistory", args);
  },
});
