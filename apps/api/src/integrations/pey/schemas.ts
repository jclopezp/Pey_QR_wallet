import { z } from 'zod'

export const createQrResponseSchema = z.object({
  id: z.string(),
  qrString: z.string(),
  qrImage: z.string().nullable().optional(),
})
