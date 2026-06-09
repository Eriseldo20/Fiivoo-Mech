import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
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

/** Returns existing vehicle by VIN scoped to this shop */
export const getByVin = query({
  args: { vin: v.string() },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const vin = args.vin.trim().toUpperCase();
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_shop_vin", (q) => q.eq("shopId", shopId).eq("vin", vin))
      .unique();
    if (!vehicle) return null;
    const photoUrls = await Promise.all(
      vehicle.photoStorageIds.map(async (sid) => ({
        storageId: sid,
        url: await ctx.storage.getUrl(sid as Id<"_storage">),
      }))
    );
    return { ...vehicle, photoUrls };
  },
});

/** List all vehicle profiles for the shop with stats */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const shopId = await requireShop(ctx);
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_shop_vin", (q) => q.eq("shopId", shopId))
      .collect();

    // For each vehicle, compute job count and last service info from jobs sharing that VIN
    const allJobs = await ctx.db
      .query("jobCards")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();

    return await Promise.all(
      vehicles.map(async (v) => {
        const vinJobs = allJobs.filter(
          (j) => j.vehicleVin && j.vehicleVin.trim().toUpperCase() === v.vin
        );
        const jobCount = vinJobs.length;
        const lastJob = vinJobs.sort((a, b) => b._creationTime - a._creationTime)[0];
        const lastServiceDate = lastJob ? lastJob._creationTime : null;
        const lastOdometer = lastJob?.vehicleOdometer ?? null;

        const photoUrl = v.photoStorageIds.length > 0
          ? await ctx.storage.getUrl(v.photoStorageIds[0] as Id<"_storage">)
          : null;

        return {
          ...v,
          jobCount,
          lastServiceDate,
          lastOdometer,
          photoUrl,
        };
      })
    );
  },
});

/** Full vehicle profile: vehicle + all jobs + full service history */
export const getProfile = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle || vehicle.shopId !== shopId) return null;

    const photoUrls = await Promise.all(
      vehicle.photoStorageIds.map(async (sid) => ({
        storageId: sid,
        url: await ctx.storage.getUrl(sid as Id<"_storage">),
      }))
    );

    // All jobs for this VIN in this shop
    const allShopJobs = await ctx.db
      .query("jobCards")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();

    const vinJobs = allShopJobs
      .filter((j) => j.vehicleVin && j.vehicleVin.trim().toUpperCase() === vehicle.vin)
      .sort((a, b) => b._creationTime - a._creationTime);

    const jobsWithData = await Promise.all(
      vinJobs.map(async (j) => {
        const employee = j.assignedEmployeeId ? await ctx.db.get(j.assignedEmployeeId) : null;
        const estimate = j.estimatedId ? await ctx.db.get(j.estimatedId) : null;
        const totalCharge = estimate
          ? estimate.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0)
          : null;
        const historyEntries = await ctx.db
          .query("serviceHistory")
          .withIndex("by_job", (q) => q.eq("jobCardId", j._id))
          .collect();
        return { ...j, employeeName: employee?.name ?? null, totalCharge, historyEntries };
      })
    );

    // Flatten all service history across all jobs, sorted by odometer desc
    const allHistory = jobsWithData
      .flatMap((j) =>
        j.historyEntries.map((h) => ({ ...h, jobNumber: j.jobNumber, jobStatus: j.status }))
      )
      .sort((a, b) => b.odometerKm - a.odometerKm);

    return { ...vehicle, photoUrls, jobs: jobsWithData, allHistory };
  },
});

/** Upsert vehicle scoped to shop */
export const upsert = mutation({
  args: {
    vin: v.string(),
    make: v.string(),
    model: v.string(),
    year: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"vehicles">> => {
    const shopId = await requireShop(ctx);
    const vin = args.vin.trim().toUpperCase();
    const existing = await ctx.db
      .query("vehicles")
      .withIndex("by_shop_vin", (q) => q.eq("shopId", shopId).eq("vin", vin))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { make: args.make, model: args.model, year: args.year });
      return existing._id;
    }
    return await ctx.db.insert("vehicles", {
      shopId,
      vin,
      make: args.make,
      model: args.model,
      year: args.year,
      photoStorageIds: [],
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireShop(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const addPhoto = mutation({
  args: { vehicleId: v.id("vehicles"), storageId: v.string() },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle || vehicle.shopId !== shopId) throw new ConvexError({ message: "Vehicle not found", code: "NOT_FOUND" });
    await ctx.db.patch(args.vehicleId, {
      photoStorageIds: [...vehicle.photoStorageIds, args.storageId],
    });
  },
});

export const removePhoto = mutation({
  args: { vehicleId: v.id("vehicles"), storageId: v.string() },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle || vehicle.shopId !== shopId) throw new ConvexError({ message: "Vehicle not found", code: "NOT_FOUND" });
    await ctx.storage.delete(args.storageId as Id<"_storage">);
    await ctx.db.patch(args.vehicleId, {
      photoStorageIds: vehicle.photoStorageIds.filter((s) => s !== args.storageId),
    });
  },
});

export const remove = mutation({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const shopId = await requireShop(ctx);
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle || vehicle.shopId !== shopId) throw new ConvexError({ message: "Vehicle not found", code: "NOT_FOUND" });
    // Delete all stored photos from file storage
    for (const storageId of vehicle.photoStorageIds) {
      await ctx.storage.delete(storageId as Id<"_storage">);
    }
    await ctx.db.delete(args.vehicleId);
  },
});

