import { z } from 'zod';

import { STRINGS } from '@/constants/strings';

export const loginSchema = z.object({
  email: z.string().min(1, STRINGS.ERRORS.REQUIRED_FIELD).email(STRINGS.ERRORS.INVALID_EMAIL),
  password: z.string().min(6, STRINGS.ERRORS.SHORT_PASSWORD),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(1, STRINGS.ERRORS.REQUIRED_FIELD),
  email: z.string().min(1, STRINGS.ERRORS.REQUIRED_FIELD).email(STRINGS.ERRORS.INVALID_EMAIL),
  password: z.string().min(6, STRINGS.ERRORS.SHORT_PASSWORD),
  role: z.enum(['Customer', 'Owner']),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
