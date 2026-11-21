import { z } from 'zod';

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
