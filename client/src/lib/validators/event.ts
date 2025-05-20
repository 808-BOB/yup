import { z } from 'zod';
import { insertEventSchema as baseInsertEventSchema } from '@shared/schema';

// Re-export the insert event schema with extension capability
export const insertEventSchema = z.object({
  ...baseInsertEventSchema.shape,
  // Add any additional fields or overrides here
});