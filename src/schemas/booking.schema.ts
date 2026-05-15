import { z } from 'zod';
import { STRINGS } from '@/constants/strings';

export const createServiceSchema = z.object({
  name: z.string().min(1, STRINGS.ERRORS.REQUIRED_FIELD),
  description: z.string().optional(),
  duration: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
});

export type CreateServiceFormValues = z.infer<typeof createServiceSchema>;
