import Fastify, { type FastifyServerOptions } from 'fastify';
import type { HealthResponse } from '@buzzqr/shared';
import { openDatabase } from './db/bank-account-db';
import { registerBankAccountRoutes, type BankAccountRouteOptions } from './routes/bank-account';

/** Never write credentials to logs; E1-6 and E3-1 add these headers. */
export const LOG_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["webhook-signature"]',
  'res.headers["set-cookie"]',
];

export type BuildAppOptions = {
  logger?: FastifyServerOptions['logger'];
  bankAccount?: BankAccountRouteOptions;
};

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger:
      options.logger === true
        ? { redact: { paths: LOG_REDACT_PATHS, censor: '[redacted]' } }
        : options.logger
          ? { redact: { paths: LOG_REDACT_PATHS, censor: '[redacted]' }, ...options.logger }
          : false,
  });

  app.get('/health', async (): Promise<HealthResponse> => ({ status: 'ok' }));

  const bankAccount = options.bankAccount ?? {
    db: openDatabase(':memory:'),
    pey: {
      createBankAccount: () =>
        Promise.reject(Object.assign(new Error('pey_unavailable'), { code: 'pey_unavailable' })),
    },
    resolveUser: () => null,
  };
  registerBankAccountRoutes(app, bankAccount);

  return app;
}
