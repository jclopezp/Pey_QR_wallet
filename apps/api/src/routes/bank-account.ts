import type { BankAccountView } from '@buzzqr/shared';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import {
  BankAccountRouteError,
  registerBankAccount,
  type BankAccountPey,
} from '../bank-account/register';
import { findBusinessByUser, toBankAccountView } from '../db/bank-account-db';

export type BankAccountRouteOptions = {
  db: DatabaseSync;
  pey: BankAccountPey;
  resolveUser: (request: FastifyRequest) => string | null;
};

export function registerBankAccountRoutes(
  app: FastifyInstance,
  options: BankAccountRouteOptions,
): void {
  const inflight = new Map<string, Promise<BankAccountView>>();
  const deps = { db: options.db, pey: options.pey, inflight };

  app.get('/bank-account', async (request, reply) => {
    const userId = options.resolveUser(request);
    if (!userId) return reply.code(401).send({ error: { code: 'unauthenticated' } });

    const business = findBusinessByUser(options.db, userId);
    if (!business) return reply.code(404).send({ error: { code: 'business_not_found' } });

    return toBankAccountView(business);
  });

  app.post('/bank-account', async (request, reply) => {
    const userId = options.resolveUser(request);
    if (!userId) return reply.code(401).send({ error: { code: 'unauthenticated' } });

    try {
      const view = await registerBankAccount(deps, userId, request.body);
      request.log.info({ userId, status: view.status }, 'bank account registered');
      return reply.code(201).send(view);
    } catch (error) {
      if (error instanceof BankAccountRouteError) {
        request.log.info({ userId, code: error.code }, 'bank account registration rejected');
        return reply.code(error.statusCode).send({ error: { code: error.code } });
      }
      request.log.error({ userId }, 'bank account registration failed');
      throw error;
    }
  });
}
