import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// One row per unique anonymous visitor.
export const visitorsTable = pgTable("visitors", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull().unique(),
  kind: text("kind").notNull().default("guest"), // guest | user
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Legacy cumulative AI-output accounting per anonymous visitor.
export const guestUsageTable = pgTable("guest_usage", {
  id: serial("id").primaryKey(),
  guestId: text("guest_id").notNull().unique(),
  aiChars: integer("ai_chars").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
