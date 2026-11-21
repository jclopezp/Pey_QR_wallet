import { DatabaseSync } from 'node:sqlite';
import { bankAccountInputSchema, isValidClabe, type BankAccountView } from '@buzzqr/shared';
import { findBusinessByUser, saveBankAccount, toBankAccountView } from '../db/bank-account-db';

export type CreateBankAccountInput = {
  alias: string;
  name: string;
  clabe: string;
  entity: 'PERSON' | 'BUSINESS';
};

export type CreateBankAccountResult = {
  id: string;
  codiStatus: 'PENDING' | 'PROCESSING' | 'ACTIVE' | 'ERROR';
};

/** The slice of PeyClient (E2-1) this route calls. Tests pass a fake. */
export type BankAccountPey = {
  createBankAccount(input: CreateBankAccountInput): Promise<CreateBankAccountResult>;
};

export class BankAccountRouteError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string) {
    super(code);
    this.name = 'BankAccountRouteError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

type RegisterDeps = {
  db: DatabaseSync;
  pey: BankAccountPey;
  inflight: Map<string, Promise<BankAccountView>>;
};

function peyFailure(error: unknown): { code: string; peyType?: string } | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  const code = error.code;
  if (typeof code !== 'string' || !code.startsWith('pey_')) return null;
  const peyType =
    'peyType' in error && typeof error.peyType === 'string' ? error.peyType : undefined;
  return { code, peyType };
}

function failureFromPey(error: unknown): BankAccountRouteError {
  const failure = peyFailure(error);
  if (failure?.code === 'pey_unavailable') return new BankAccountRouteError(503, 'pey_unavailable');
  if (failure?.code === 'pey_invalid_request' && failure.peyType === 'INVALID_CLABE') {
    return new BankAccountRouteError(422, 'bank_not_supported');
  }
  return new BankAccountRouteError(502, 'pey_unknown');
}

async function perform(
  deps: RegisterDeps,
  userId: string,
  body: unknown,
): Promise<BankAccountView> {
  const business = findBusinessByUser(deps.db, userId);
  if (!business) throw new BankAccountRouteError(404, 'business_not_found');

  const parsed = bankAccountInputSchema.safeParse(body);
  if (!parsed.success) {
    const clabeIssue = parsed.error.issues.some((issue) => issue.path[0] === 'clabe');
    throw new BankAccountRouteError(400, clabeIssue ? 'invalid_clabe' : 'invalid_input');
  }

  if (!isValidClabe(parsed.data.clabe)) {
    throw new BankAccountRouteError(400, 'invalid_clabe');
  }

  if (business.bankAccountStatus === 'pending' || business.bankAccountStatus === 'active') {
    throw new BankAccountRouteError(409, 'account_already_registered');
  }

  let created: CreateBankAccountResult;
  try {
    created = await deps.pey.createBankAccount({
      alias: parsed.data.alias,
      name: parsed.data.holderName,
      clabe: parsed.data.clabe,
      entity: parsed.data.holderType === 'person' ? 'PERSON' : 'BUSINESS',
    });
  } catch (error) {
    throw failureFromPey(error);
  }

  if (created.codiStatus === 'ERROR') {
    throw new BankAccountRouteError(422, 'bank_not_supported');
  }

  const status =
    created.codiStatus === 'ACTIVE'
      ? 'active'
      : created.codiStatus === 'PENDING' || created.codiStatus === 'PROCESSING'
        ? 'pending'
        : null;
  if (!status) throw new BankAccountRouteError(502, 'pey_unknown');

  const saved = saveBankAccount(deps.db, {
    id: business.id,
    userId,
    peyBankAccountId: created.id,
    alias: parsed.data.alias,
    holderName: parsed.data.holderName,
    holderType: parsed.data.holderType,
    clabeLast4: parsed.data.clabe.slice(-4),
    status,
  });
  if (!saved) throw new BankAccountRouteError(409, 'account_already_registered');

  const stored = findBusinessByUser(deps.db, userId);
  if (!stored) throw new BankAccountRouteError(404, 'business_not_found');
  return toBankAccountView(stored);
}

/**
 * One registration per user at a time. The map entry is set in this same turn,
 * before `perform` yields on the Pey call, so a second submit shares that promise.
 */
export function registerBankAccount(
  deps: RegisterDeps,
  userId: string,
  body: unknown,
): Promise<BankAccountView> {
  const existing = deps.inflight.get(userId);
  if (existing) return existing;

  const work = perform(deps, userId, body);
  deps.inflight.set(userId, work);
  return work.finally(() => {
    deps.inflight.delete(userId);
  });
}
