import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  varchar,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(), // String ID for compatibility with various auth methods
  username: text("username").notNull().unique(),
  password: text("password"), // Optional for OAuth-based authentication
  display_name: text("display_name").notNull(),
  email: text("email"),
  phone_number: text("phone_number"), // Phone number for contact and password recovery
  reset_token: text("reset_token"), // Password reset token
  reset_token_expiry: timestamp("reset_token_expiry"), // Reset token expiration time
  // Removing first_name and last_name fields as they're not in the database
  profile_image_url: text("profile_image_url"),
  is_admin: boolean("is_admin").notNull().default(false),
  is_pro: boolean("is_pro").notNull().default(false),
  is_premium: boolean("is_premium").notNull().default(false),
  brand_theme: text("brand_theme").default("{}"), // JSON string containing theme preferences
  logo_url: text("logo_url"), // Custom logo URL for premium users
  stripe_customer_id: text("stripe_customer_id"), // Stripe customer ID for billing
  stripe_subscription_id: text("stripe_subscription_id"), // Current active subscription ID
  linkedin_id: text("linkedin_id"), // LinkedIn user ID for connecting profiles
  linkedin_access_token: text("linkedin_access_token"), // LinkedIn OAuth access token
  linkedin_profile_url: text("linkedin_profile_url"), // LinkedIn profile URL
  linkedin_connections: text("linkedin_connections"), // JSON string containing LinkedIn connections data
  // created_at and updated_at fields are removed as they don't exist in the database
});

export const insertUserSchema = createInsertSchema(users, {
  id: z.string(), // Explicitly mark id as string
});

export const upsertUserSchema = createInsertSchema(users, {
  id: z.string(), // Explicitly mark id as string
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  image_url: text("image_url"),
  title: text("title").notNull(),
  date: text("date").notNull(),
  start_time: text("start_time").notNull(),
  end_time: text("end_time").notNull(),
  location: text("location").notNull(),
  address: text("address"),
  description: text("description"),
  host_id: text("host_id").notNull(),
  status: text("status").notNull().default("open"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  slug: text("slug").notNull().unique(),
  allow_guest_rsvp: boolean("allow_guest_rsvp").notNull().default(true),
  allow_plus_one: boolean("allow_plus_one").notNull().default(true),
  max_guests_per_rsvp: integer("max_guests_per_rsvp").notNull().default(1),
  capacity: integer("capacity"), // null means unlimited
  use_custom_rsvp_text: boolean("use_custom_rsvp_text").notNull().default(false),
  custom_yup_text: text("custom_yup_text"),
  custom_nope_text: text("custom_nope_text"),
  custom_maybe_text: text("custom_maybe_text"),
  rsvp_visibility: text("rsvp_visibility").notNull().default("public"),
  waitlist_enabled: boolean("waitlist_enabled").notNull().default(false),
});

// Create the insert schema and refine it
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  created_at: true,
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  event_id: integer("event_id").notNull(),
  user_id: text("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  event_id: integer("event_id").notNull(),
  user_id: text("user_id"),
  response_type: text("response_type").notNull(), // 'yup', 'nope', or 'maybe'
  created_at: timestamp("created_at").notNull().defaultNow(),
  is_guest: boolean("is_guest").default(false),
  guest_name: text("guest_name"),
  guest_email: text("guest_email"),
  guest_count: integer("guest_count").default(0),
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  created_at: true,
});

// Schema for guest responses
export const guestResponseSchema = z.object({
  event_id: z.number(),
  response_type: z.enum(["yup", "nope", "maybe"]),
  is_guest: z.literal(true),
  guest_name: z.string().min(1, "Name is required"),
  guest_email: z.string().email("Valid email is required"),
  guest_count: z.number().min(0).default(0),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
