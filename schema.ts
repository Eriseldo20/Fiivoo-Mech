import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  // Vehicles are scoped per shop — same VIN can exist across different shops
  vehicles: defineTable({
    shopId: v.optional(v.id("users")),
    vin: v.string(),
    make: v.string(),
    model: v.string(),
    year: v.string(),
    photoStorageIds: v.array(v.string()),
  })
    .index("by_shop_vin", ["shopId", "vin"]),

  employees: defineTable({
    shopId: v.optional(v.id("users")),
    name: v.string(),
    role: v.union(v.literal("mechanic"), v.literal("service_advisor"), v.literal("admin")),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    active: v.boolean(),
  }).index("by_shopId", ["shopId"]),

  jobCards: defineTable({
    shopId: v.optional(v.id("users")),
    jobNumber: v.string(),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    vehicleMake: v.string(),
    vehicleModel: v.string(),
    vehicleYear: v.string(),
    vehicleVin: v.optional(v.string()),
    vehicleOdometer: v.optional(v.string()),
    assignedEmployeeId: v.optional(v.id("employees")),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("awaiting_parts"),
      v.literal("complete"),
      v.literal("invoiced")
    ),
    description: v.string(),
    notes: v.optional(v.string()),
    estimatedId: v.optional(v.id("estimates")),
    photoStorageIds: v.optional(v.array(v.string())),
    paid: v.optional(v.boolean()),
  })
    .index("by_shopId", ["shopId"])
    .index("by_shop_status", ["shopId", "status"])
    .index("by_shop_employee", ["shopId", "assignedEmployeeId"]),

  jobTasks: defineTable({
    jobCardId: v.id("jobCards"),
    title: v.string(),
    completed: v.boolean(),
  }).index("by_job", ["jobCardId"]),

  serviceHistory: defineTable({
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
  }).index("by_job", ["jobCardId"]),

  maintenanceReminders: defineTable({
    shopId: v.optional(v.id("users")),
    customerName: v.string(),
    vehicleMake: v.string(),
    vehicleModel: v.string(),
    vehicleYear: v.string(),
    vehicleVin: v.optional(v.string()),
    serviceType: v.union(
      v.literal("oil_change"),
      v.literal("tyre_rotation"),
      v.literal("brake_service"),
      v.literal("full_service"),
      v.literal("inspection"),
      v.literal("timing_belt"),
      v.literal("coolant_flush"),
      v.literal("transmission_service"),
      v.literal("other")
    ),
    dueDate: v.string(), // ISO 8601 date string YYYY-MM-DD
    notes: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled")),
    jobCardId: v.optional(v.id("jobCards")),
    estimateId: v.optional(v.id("estimates")),
  })
    .index("by_shopId", ["shopId"])
    .index("by_shop_status", ["shopId", "status"])
    .index("by_shop_dueDate", ["shopId", "dueDate"]),

  estimates: defineTable({
    shopId: v.optional(v.id("users")),
    estimateNumber: v.string(),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    vehicleMake: v.string(),
    vehicleModel: v.string(),
    vehicleYear: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        type: v.union(v.literal("labour"), v.literal("part")),
      })
    ),
    notes: v.optional(v.string()),
    jobCardId: v.optional(v.id("jobCards")),
  })
    .index("by_shopId", ["shopId"])
    .index("by_shop_status", ["shopId", "status"]),
});
