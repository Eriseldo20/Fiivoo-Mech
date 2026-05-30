import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";
import type { QueryCtx } from "./_generated/server";

async function getShopId(ctx: QueryCtx): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  return user?._id ?? null;
}

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const shopId = await getShopId(ctx);
    if (!shopId) return null;

    const allJobs = await ctx.db
      .query("jobCards")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();

    const totalJobs = allJobs.length;
    const inProgressJobs = allJobs.filter((j) => j.status === "in_progress").length;
    const pendingJobs = allJobs.filter((j) => j.status === "pending").length;
    const completedJobs = allJobs.filter((j) => j.status === "complete").length;

    const allEstimates = await ctx.db
      .query("estimates")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect();
    const openEstimates = allEstimates.filter(
      (e) => e.status === "draft" || e.status === "sent"
    ).length;

    const totalEmployees = await ctx.db
      .query("employees")
      .withIndex("by_shopId", (q) => q.eq("shopId", shopId))
      .collect()
      .then((r) => r.length);

    // Open jobs (not complete/invoiced), sorted newest first, max 8
    const openJobs = allJobs
      .filter((j) => j.status !== "complete" && j.status !== "invoiced")
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 8);

    // Attach first photo URL + employee name to each open job
    const openJobsWithDetails = await Promise.all(
      openJobs.map(async (j) => {
        // Try vehicle photos first (VIN-based)
        let firstPhotoUrl: string | null = null;
        if (j.vehicleVin) {
          const vin = j.vehicleVin.trim().toUpperCase();
          const vehicle = await ctx.db
            .query("vehicles")
            .withIndex("by_shop_vin", (q) => q.eq("shopId", shopId).eq("vin", vin))
            .unique();
          const firstStorageId = vehicle?.photoStorageIds[0];
          if (firstStorageId) {
            firstPhotoUrl = await ctx.storage.getUrl(firstStorageId as Id<"_storage">);
          }
        }
        // Fallback to job-level photos
        if (!firstPhotoUrl) {
          const firstStorageId = (j.photoStorageIds ?? [])[0];
          if (firstStorageId) {
            firstPhotoUrl = await ctx.storage.getUrl(firstStorageId as Id<"_storage">);
          }
        }
        const employee = j.assignedEmployeeId
          ? await ctx.db.get(j.assignedEmployeeId)
          : null;
        return {
          _id: j._id,
          jobNumber: j.jobNumber,
          customerName: j.customerName,
          vehicleYear: j.vehicleYear,
          vehicleMake: j.vehicleMake,
          vehicleModel: j.vehicleModel,
          status: j.status,
          firstPhotoUrl,
          employeeName: employee?.name ?? null,
        };
      })
    );

    const recentJobs = allJobs
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5);

    return {
      totalJobs,
      inProgressJobs,
      pendingJobs,
      completedJobs,
      openEstimates,
      totalEmployees,
      recentJobs,
      openJobsWithDetails,
    };
  },
});
