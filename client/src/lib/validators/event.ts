import { z } from 'zod';
import { insertEventSchema as baseInsertEventSchema } from '@shared/schema';

// Re-export the insert event schema for use in the create event form
export const insertEventSchema = baseInsertEventSchema;