import { pgTable, uniqueIndex, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const tenants = pgTable("tenants", {
	id: uuid().default(sql`public.uuid_generate_v7()`).notNull(),
	name: text(),
	created: timestamp({ mode: 'string' }).default(sql`LOCALTIMESTAMP`).notNull(),
	updated: timestamp({ mode: 'string' }).default(sql`LOCALTIMESTAMP`).notNull(),
	deleted: timestamp({ mode: 'string' }),
	computeId: uuid("compute_id"),
}, (table) => [
	uniqueIndex("tenants_pkey").using("btree", table.id.asc().nullsLast().op("uuid_ops")),
]);
