import Fastify from 'fastify';
import type { HealthResponse } from '@buzzqr/shared';

/** Never write credentials to logs; E1-6 and E3-1 add these headers. */
export const LOG_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["webhook-signature"]',
  'res.headers["set-cookie"]',
];

export function buildApp(options: { logger?: boolean } = {}) {
  const app = Fastify({
    logger: options.logger ? { redact: { paths: LOG_REDACT_PATHS, censor: '[redacted]' } } : false,
  });

  app.get('/health', async (): Promise<HealthResponse> => ({ status: 'ok' }));

  return app;
}
