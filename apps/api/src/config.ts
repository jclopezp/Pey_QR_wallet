import { z } from 'zod';

const nonEmpty = z.string().min(1);

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  PEY_BASE_URL: z.url({ protocol: /^https?$/ }),
  DATABASE_URL: nonEmpty,
  // Secrets are required in every environment so a forgotten NODE_ENV can never boot with an empty key.
  PEY_API_KEY: nonEmpty,
  PEY_WEBHOOK_SECRET: nonEmpty,
  SESSION_SECRET: nonEmpty,
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
