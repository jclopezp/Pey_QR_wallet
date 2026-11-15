import Fastify from 'fastify';
import type { HealthResponse } from '@buzzqr/shared';

export function buildApp(options: { logger?: boolean } = {}) {
  const app = Fastify({ logger: options.logger ?? false });

  app.get('/health', async (): Promise<HealthResponse> => ({ status: 'ok' }));

  return app;
}
