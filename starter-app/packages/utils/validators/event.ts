import { z } from 'zod';

// Create a custom event schema with all the fields we need
export const insertEventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  date: z.string().min(1, "Event date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
  address: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  hostId: z.string().uuid("Host ID must be a valid UUID"),  // Must be UUID from auth.users
  status: z.string().default("open"),
  slug: z.string().optional(),
  allowGuestRsvp: z.boolean().default(true),
  allowPlusOne: z.boolean().default(true),
  maxGuestsPerRsvp: z.coerce.number().default(1),
  customYesText: z.string().optional(),
  customNoText: z.string().optional(),
  useCustomRsvpText: z.boolean().default(false),
});