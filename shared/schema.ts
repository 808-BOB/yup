import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  isPremium: boolean("is_premium").notNull().default(false),
  brandTheme: text("brand_theme").default("{}"), // JSON string containing theme preferences
  logoUrl: text("logo_url"), // Custom logo URL for premium users
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  isAdmin: true,
  isPremium: true,
  brandTheme: true,
  logoUrl: true,
});

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
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id"), // Optional for guest responses
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

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
