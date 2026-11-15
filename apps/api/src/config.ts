import { z } from 'zod';

const nonEmpty = z.string().min(1);

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    PEY_BASE_URL: z.url(),
    DATABASE_URL: nonEmpty,
    // Secrets: may be empty while developing locally, required in production.
    PEY_API_KEY: z.string().default(''),
    PEY_WEBHOOK_SECRET: z.string().default(''),
    SESSION_SECRET: z.string().default(''),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    for (const key of ['PEY_API_KEY', 'PEY_WEBHOOK_SECRET', 'SESSION_SECRET'] as const) {
      if (!env[key])
        ctx.addIssue({ code: 'custom', path: [key], message: 'Required in production' });
    }
  });

export type Config = z.infer<typeof EnvSchema>;

/** Validates the environment and throws listing the offending variable names (never their values). */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n  ');
    throw new Error(`Invalid environment configuration:\n  ${problems}`);
  }
  return result.data;
}
