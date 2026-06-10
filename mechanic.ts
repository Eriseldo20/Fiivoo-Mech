import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel.d.ts";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// ── Access-code auth ──────────────────────────────────────────────────────────
// Mechanics do not have OIDC accounts. They authenticate with an owner-generated
// access code. Every function resolves the code to an active employee and scopes
// all data to job cards assigned to that employee. Pricing / estimate data is
// NEVER returned to a mechanic.

async function requireMechanic(
  ctx: MutationCtx | QueryCtx,
  accessCode: string
): Promise<Doc<"employees">> {
  const code = accessCode.trim().toUpperCase();
  if (!code) throw new ConvexError({ message: "Access code required", code: "UNAUTHENTICATED" });
  const employee = await ctx.db
    .query("employees")
    .withIndex("by_accessCode", (q) => q.eq("accessCode", code))
    .unique();
  if (!employee || !employee.active) {
    throw new ConvexError({ message: "Invalid or inactive access code", code: "UNAUTHENTICATED" });
  }
  return employee;
}

/** Load a job card and assert it is assigned to this mechanic. */
async function requireAssignedJob(
  ctx: MutationCtx | QueryCtx,
  employee: Doc<"employees">,
  jobCardId: Id<"jobCards">
): Promise<Doc<"jobCards">> {
  const job = await ctx.db.get(jobCardId);
  if (
    !job ||
    job.shopId !== employee.shopId ||
    job.assignedEmployeeId !== employee._id
  ) {
    throw new ConvexError({ message: "Job not found", code: "NOT_FOUND" });
  }
  return job;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  awaiting_parts: "Awaiting Parts",
  complete: "Complete",
  invoiced: "Invoiced",
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** Validate a code and return the mechanic's identity (for login + header). */
export const me = query({
  args: { accessCode: v.string() },
  handler: async (ctx, args) => {
    const code = args.accessCode.trim().toUpperCase();
    if (!code) return null;
    const employee = await ctx.db
      .query("employees")
      .withIndex("by_accessCode", (q) => q.eq("accessCode", code))
      .unique();
    if (!employee || !employee.active) return null;
    const shop = employee.shopId ? await ctx.db.get(employee.shopId) : null;
    return {
      id: employee._id,
      name: employee.name,
      role: employee.role,
      shopName: shop?.name ?? null,
    };
  },
});

/** List the jobs assigned to this mechanic. No prices, no estimate totals. */
export const listJobs = query({
  args: { accessCode: v.string() },
  handler: async (ctx, args) => {
    const employee = await requireMechanic(ctx, args.accessCode);
    if (!employee.shopId) return [];
    const jobs = await ctx.db
      .query("jobCards")
      .withIndex("by_shop_employee", (q) =>
        q.eq("shopId", employee.shopId).eq("assignedEmployeeId", employee._id)
      )
      .collect();

    const withTasks = await Promise.all(
      jobs.map(async (j) => {
        const tasks = await ctx.db
          .query("jobTasks")
          .withIndex("by_job", (q) => q.eq("jobCardId", j._id))
          .collect();
        const done = tasks.filter((t) => t.completed).length;
        return {
          _id: j._id,
          jobNumber: j.jobNumber,
          status: j.status,
          statusLabel: STATUS_LABELS[j.status] ?? j.status,
          customerName: j.customerName,
          vehicle: `${j.vehicleYear} ${j.vehicleMake} ${j.vehicleModel}`.trim(),
          description: j.description,
          taskCount: tasks.length,
          tasksDone: done,
          hasSignature: Boolean(j.signatureStorageId),
          _creationTime: j._creationTime,
        };
      })
    );

    // Active jobs first, then by newest.
    const rank = (s: string) => (s === "complete" || s === "invoiced" ? 1 : 0);
    return withTasks.sort(
      (a, b) => rank(a.status) - rank(b.status) || b._creationTime - a._creationTime
    );
  },
});

/** Full job detail for a mechanic — deliberately omits estimate & pricing. */
export const getJob = query({
  args: { accessCode: v.string(), jobCardId: v.id("jobCards") },
  handler: async (ctx, args) => {
    const employee = await requireMechanic(ctx, args.accessCode);
    const job = await requireAssignedJob(ctx, employee, args.jobCardId);

    // Photos — prefer shared vehicle profile, fall back to legacy job photos.
    let photoUrls: { storageId: string; url: string | null }[] = [];
    if (job.vehicleVin && employee.shopId) {
      const vin = job.vehicleVin.trim().toUpperCase();
      const vehicle = await ctx.db
        .query("vehicles")
        .withIndex("by_shop_vin", (q) => q.eq("shopId", employee.shopId).eq("vin", vin))
        .unique();
      if (vehicle) {
        photoUrls = await Promise.all(
          vehicle.photoStorageIds.map(async (sid) => ({
            storageId: sid,
            url: await ctx.storage.getUrl(sid as Id<"_storage">),
          }))
        );
      }
    }
    // Always include any photos stored directly on the job card too.
    const jobPhotos = await Promise.all(
      (job.photoStorageIds ?? []).map(async (sid) => ({
        storageId: sid,
        url: await ctx.storage.getUrl(sid as Id<"_storage">),
      }))
    );
    const seen = new Set(photoUrls.map((p) => p.storageId));
    for (const p of jobPhotos) if (!seen.has(p.storageId)) photoUrls.push(p);

    const tasks = await ctx.db
      .query("jobTasks")
      .withIndex("by_job", (q) => q.eq("jobCardId", job._id))
      .collect();

    const history = await ctx.db
      .query("serviceHistory")
      .withIndex("by_job", (q) => q.eq("jobCardId", job._id))
      .order("desc")
      .collect();

    const signatureUrl = job.signatureStorageId
      ? await ctx.storage.getUrl(job.signatureStorageId as Id<"_storage">)
      : null;

    // NOTE: estimatedId / estimate / totals are intentionally excluded.
    return {
      _id: job._id,
      jobNumber: job.jobNumber,
      status: job.status,
      statusLabel: STATUS_LABELS[job.status] ?? job.status,
      customerName: job.customerName,
      customerPhone: job.customerPhone ?? null,
      vehicleMake: job.vehicleMake,
      vehicleModel: job.vehicleModel,
      vehicleYear: job.vehicleYear,
      vehicleVin: job.vehicleVin ?? null,
      vehicleOdometer: job.vehicleOdometer ?? null,
      description: job.description,
      notes: job.notes ?? null,
      photoUrls,
      tasks: tasks.map((t) => ({ _id: t._id, title: t.title, completed: t.completed })),
      history: history.map((h) => ({
        _id: h._id,
        odometerKm: h.odometerKm,
        description: h.description,
        type: h.type,
        _creationTime: h._creationTime,
      })),
      signatureUrl,
      signedByName: job.signedByName ?? null,
      signedAt: job.signedAt ?? null,
    };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const updateStatus = mutation({
  args: {
    accessCode: v.string(),
    jobCardId: v.id("jobCards"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("awaiting_parts"),
      v.literal("complete")
    ),
  },
  handler: async (ctx, args) => {
    const employee = await requireMechanic(ctx, args.accessCode);
    await requireAssignedJob(ctx, employee, args.jobCardId);
    // Mechanics may not set "invoiced" — that's an owner/billing action.
    await ctx.db.patch(args.jobCardId, { status: args.status });
  },
});

export const toggleTask = mutation({
  args: { accessCode: v.string(), jobCardId: v.id("jobCards"), taskId: v.id("jobTasks"), completed: v.boolean() },
  handler: async (ctx, args) => {
    const employee = await requireMechanic(ctx, args.accessCode);
    await requireAssignedJob(ctx, employee, args.jobCardId);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.jobCardId !== args.jobCardId) {
      throw new ConvexError({ message: "Task not found", code: "NOT_FOUND" });
    }
    await ctx.db.patch(args.taskId, { completed: args.completed });
  },
});

export const addHistoryEntry = mutation({
  args: {
    accessCode: v.string(),
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
    const employee = await requireMechanic(ctx, args.accessCode);
    await requireAssignedJob(ctx, employee, args.jobCardId);
    return await ctx.db.insert("serviceHistory", {
      jobCardId: args.jobCardId,
      odometerKm: args.odometerKm,
      description: args.description,
      type: args.type,
    });
  },
});

// ── Photos ──────────────────────────────────────────────────────────────────

export const generateUploadUrl = mutation({
  args: { accessCode: v.string() },
  handler: async (ctx, args) => {
    await requireMechanic(ctx, args.accessCode);
    return await ctx.storage.generateUploadUrl();
  },
});

export const addPhoto = mutation({
  args: { accessCode: v.string(), jobCardId: v.id("jobCards"), storageId: v.string() },
  handler: async (ctx, args) => {
    const employee = await requireMechanic(ctx, args.accessCode);
    const job = await requireAssignedJob(ctx, employee, args.jobCardId);
    const existing = job.photoStorageIds ?? [];
    await ctx.db.patch(args.jobCardId, { photoStorageIds: [...existing, args.storageId] });
  },
});

export const removePhoto = mutation({
  args: { accessCode: v.string(), jobCardId: v.id("jobCards"), storageId: v.string() },
  handler: async (ctx, args) => {
    const employee = await requireMechanic(ctx, args.accessCode);
    const job = await requireAssignedJob(ctx, employee, args.jobCardId);
    // Only allow deleting photos that live on the job card (not shared vehicle photos).
    if (!(job.photoStorageIds ?? []).includes(args.storageId)) {
      throw new ConvexError({ message: "Photo not found on this job", code: "NOT_FOUND" });
    }
    await ctx.storage.delete(args.storageId as Id<"_storage">);
    await ctx.db.patch(args.jobCardId, {
      photoStorageIds: (job.photoStorageIds ?? []).filter((s) => s !== args.storageId),
    });
  },
});

// ── Customer sign-off ─────────────────────────────────────────────────────────

export const saveSignature = mutation({
  args: {
    accessCode: v.string(),
    jobCardId: v.id("jobCards"),
    storageId: v.string(),
    signedByName: v.string(),
  },
  handler: async (ctx, args) => {
    const employee = await requireMechanic(ctx, args.accessCode);
    const job = await requireAssignedJob(ctx, employee, args.jobCardId);
    // Replace any previous signature image.
    if (job.signatureStorageId && job.signatureStorageId !== args.storageId) {
      try {
        await ctx.storage.delete(job.signatureStorageId as Id<"_storage">);
      } catch {
        // ignore if already gone
      }
    }
    await ctx.db.patch(args.jobCardId, {
      signatureStorageId: args.storageId,
      signedByName: args.signedByName.trim(),
      signedAt: Date.now(),
    });
  },
});

export const completeJob = mutation({
  args: { accessCode: v.string(), jobCardId: v.id("jobCards") },
  handler: async (ctx, args) => {
    const employee = await requireMechanic(ctx, args.accessCode);
    await requireAssignedJob(ctx, employee, args.jobCardId);
    await ctx.db.patch(args.jobCardId, { status: "complete" });
  },
});
