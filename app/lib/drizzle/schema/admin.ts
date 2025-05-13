// File: app/lib/drizzle/schema/admin.ts

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  serial, // For auto-incrementing integer PK for AdminLogs
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Import enums (if any are specific to admin or already defined)
// No new enums seem immediately necessary for these two tables based on previous plan.

// Import related tables for foreign keys
import { UsersTable } from "./users"; // For adminUserId and lastUpdatedByUserId

// --- ADMIN LOGS TABLE ---
// Tracks actions performed by administrators in the admin panel
export const AdminLogsTable = pgTable("admin_logs", {
  id: serial("id").primaryKey(), // Using serial auto-incrementing integer for simplicity
  adminUserId: uuid("admin_user_id") // The User ID of the admin who performed the action
    .notNull()
    .references(() => UsersTable.id, { onDelete: "restrict" }), // Keep log even if admin user is somehow deleted (restrict is safer) or SET NULL
  action: varchar("action", { length: 255 }).notNull(), // e.g., "BANNED_USER", "APPROVED_GIG_MODERATION", "UPDATED_AI_PROMPT"
  targetEntityType: varchar("target_entity_type", { length: 100 }), // e.g., "USER", "GIG", "REVIEW", "AI_PROMPT"
  targetEntityId: varchar("target_entity_id", { length: 255 }), // Typically the UUID of the affected entity
  detailsJson: jsonb("details_json"), // Optional: Stores details like old/new values for an update, reason, etc.
  // e.g., { oldValue: { status: 'PENDING' }, newValue: { status: 'APPROVED' }, reason: 'User request' }
  ipAddress: varchar("ip_address", { length: 45 }), // Optional: IP address of the admin at the time of action

  timestamp: timestamp("timestamp", { mode: "date", withTimezone: true }) // Renamed from createdAt for clarity as it's the event time
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// --- AI PROMPTS TABLE ---
// Stores AI prompts that can be managed by administrators
export const AiPromptsTable = pgTable("ai_prompts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  promptKey: varchar("prompt_key", { length: 100 }).unique().notNull(), // A unique key to identify the prompt, e.g., "WORKER_ONBOARDING_GREETING"
  promptText: text("prompt_text").notNull(), // The actual text of the prompt
  description: text("description"), // Optional: A brief description of where/how this prompt is used
  version: integer("version").default(1).notNull(), // For tracking changes to a prompt
  isActive: boolean("is_active").default(true).notNull(), // To enable/disable prompts without deleting

  // Who last updated this prompt
  lastUpdatedByUserId: uuid("last_updated_by_user_id").references(
    () => UsersTable.id,
    { onDelete: "set null" }
  ), // If updating admin is deleted, keep prompt but nullify updater

  // Timestamps
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(), // Application logic should update this field
});

// --- TODO: Define relations for these tables in relations.ts or schema/index.ts ---
// Example:
// export const adminLogsRelations = relations(AdminLogsTable, ({ one }) => ({
//   adminUser: one(UsersTable, {
//     fields: [AdminLogsTable.adminUserId],
//     references: [UsersTable.id],
//     relationName: "LogAdminUser"
//   }),
// }));

// export const aiPromptsRelations = relations(AiPromptsTable, ({ one }) => ({
//   lastUpdatedByUser: one(UsersTable, {
//     fields: [AiPromptsTable.lastUpdatedByUserId],
//     references: [UsersTable.id],
//     relationName: "PromptUpdaterUser"
//   }),
// }));
