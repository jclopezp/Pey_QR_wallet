import { z } from 'zod';
import { PeyError } from './errors';

export const createQrRequestSchema = z.object({
  amountCents: z.number().int().nonnegative(),
  concept: z.string().min(1).optional(),
  bankAccountId: z.string().min(1),
  metadata: z.object({
    qrId: z.string().min(1),
    businessId: z.string().min(1),
  }),
});

export const createBankAccountRequestSchema = z.object({
  alias: z.string().min(1),
  name: z.string().min(1),
  clabe: z.string().regex(/^\d{18}$/),
  entity: z.enum(['PERSON', 'BUSINESS']),
});

export const bankAccountIdSchema = z.string().min(1);

/** Validates a request before it is sent. A bad body becomes pey_invalid_request and is not transmitted. */
export function readInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new PeyError('pey_invalid_request');
  }
  return result.data;
}

export const createQrResponseSchema = z.object({
  id: z.string(),
  qrString: z.string(),
  qrImage: z.string().nullable().optional(),
});

export const codiStatusSchema = z.enum(['PENDING', 'PROCESSING', 'ACTIVE', 'ERROR']);

export const createBankAccountResponseSchema = z.object({
  id: z.string(),
  codiStatus: codiStatusSchema,
});

export const bankAccountResponseSchema = createBankAccountResponseSchema.extend({
  alias: z.string(),
  name: z.string(),
  clabe: z.string(),
  entity: z.enum(['PERSON', 'BUSINESS']),
  errorMessage: z.string().optional(),
});
