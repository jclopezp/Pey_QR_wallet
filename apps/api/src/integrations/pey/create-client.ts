import type { PeyClient } from './client';
import { HttpPeyClient } from './http-client';
import { MockPeyClient } from './mock-client';

export type PeyLogger = { info: (obj: Record<string, unknown>) => void };

export type PeyClientEnv = {
  PEY_MODE: 'mock' | 'live';
  PEY_API_KEY?: string;
  PEY_BASE_URL: string;
  logger?: PeyLogger;
};

export function createPeyClient(env: PeyClientEnv): PeyClient {
  if (env.PEY_MODE === 'live') {
    if (!env.PEY_API_KEY?.trim()) {
      throw new Error('PEY_API_KEY is required when PEY_MODE is live');
    }
    return new HttpPeyClient({
      baseUrl: env.PEY_BASE_URL,
      apiKey: env.PEY_API_KEY,
      logger: env.logger,
    });
  }
  return new MockPeyClient();
}
