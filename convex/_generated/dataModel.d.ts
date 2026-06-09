/* eslint-disable */
/**
 * Generated data model types stub.
 *
 * THIS FILE IS A STUB. Run `npx convex dev` to generate the real version.
 */

/**
 * The type of a Convex document identifier.
 */
export type Id<TableName extends string> = string & {
  readonly __tableName: TableName;
};

/**
 * A Convex document — typed as any until `convex dev` generates real types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Doc<TableName extends string> = any;

/**
 * Table names in the data model.
 */
export type TableNames =
  | "users"
  | "vehicles"
  | "employees"
  | "jobCards"
  | "jobTasks"
  | "serviceHistory"
  | "maintenanceReminders"
  | "estimates";
