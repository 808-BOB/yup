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
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users, {
  id: z.string(), // Explicitly mark id as string
}).omit({
  created_at: true,
  updated_at: true,
});

export const upsertUserSchema = createInsertSchema(users, {
  id: z.string(), // Explicitly mark id as string
}).omit({
  created_at: true,
  updated_at: true,
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
  imageUrl: text("image_url"),
  title: text("title").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location").notNull(),
  address: text("address"),
  description: text("description"),
  hostId: integer("host_id").notNull(),
  hostDisplayText: text("host_display_text"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  slug: text("slug").notNull().unique(),
  allowGuestRsvp: boolean("allow_guest_rsvp").notNull().default(true),
  allowPlusOne: boolean("allow_plus_one").notNull().default(true),
  maxGuestsPerRsvp: integer("max_guests_per_rsvp").notNull().default(3),
  showRsvpsToInvitees: boolean("show_rsvps_to_invitees").notNull().default(true),
  showRsvpsAfterThreshold: boolean("show_rsvps_after_threshold").notNull().default(false),
  rsvpVisibilityThreshold: integer("rsvp_visibility_threshold").notNull().default(5),
  // Custom RSVP button text options (for premium users)
  customYesText: text("custom_yes_text"), // If set, replaces "Yup" with this text
  customNoText: text("custom_no_text"), // If set, replaces "Nope" with this text
  useCustomRsvpText: boolean("use_custom_rsvp_text").notNull().default(false),
});

// Create the insert schema and refine it
export const insertEventSchema = createInsertSchema(events)
  .omit({
    id: true,
    createdAt: true,
  })
  .transform((data) => ({
    ...data,
    // Handle potentially null or undefined values with defaults
    address: data.address || "",
    description: data.description || "",
  }));

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: text("user_id").notNull(), // Changed to text to match user ID format
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: text("user_id"), // Optional for guest responses, changed to text for Firebase auth
  response: text("response").notNull(), // 'yup', 'nope', or 'maybe'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Guest information
  isGuest: boolean("is_guest").default(false),
  guestName: text("guest_name"), // For guest responses
  guestEmail: text("guest_email"), // For guest responses
  guestCount: integer("guest_count").default(0), // Number of additional guests (+1, +2, etc.)
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  createdAt: true,
});

// Schema for guest responses
export const guestResponseSchema = z.object({
  eventId: z.number(),
  response: z.enum(["yup", "nope", "maybe"]),
  isGuest: z.literal(true),
  guestName: z.string().min(1, "Name is required"),
  guestEmail: z.string().email("Valid email is required"),
  guestCount: z.number().min(0).default(0),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
