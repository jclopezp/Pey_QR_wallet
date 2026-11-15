import { z } from 'zod'

const envSchema = z.object({
  PEY_MODE: z.enum(['mock', 'live']),
  PEY_BASE_URL: z.string().url().default('https://api.pey.mx'),
  PEY_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    throw new Error('Invalid environment')
  }
  return parsed.data
}
