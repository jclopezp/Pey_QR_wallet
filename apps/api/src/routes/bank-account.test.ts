import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { isValidClabe } from '@buzzqr/shared';
import { buildApp } from '../app';
import { openDatabase } from '../db/bank-account-db';
import type { CreateBankAccountInput, CreateBankAccountResult } from '../bank-account/register';

const VALID_CLABE = '012180001234567899';
const OTHER_CLABE = '002010077777777771';
const PEY_ID = '01JBAVWE4NS5TGXHWGMX3KH23Q';

function seed(appDb: ReturnType<typeof openDatabase>, userId: string, name: string) {
  appDb
    .prepare('INSERT INTO businesses (id, userId, name) VALUES (?, ?, ?)')
    .run(randomUUID(), userId, name);
}

function setup(
  pey: {
    createBankAccount: (input: CreateBankAccountInput) => Promise<CreateBankAccountResult>;
  },
  logger: boolean | { stream: { write: (message: string) => void } } = false,
) {
  const db = openDatabase(':memory:');
  seed(db, 'user-a', 'Ana');
  seed(db, 'user-b', 'Beto');
  const app = buildApp({
    logger,
    bankAccount: {
      db,
      pey,
      resolveUser: (request) => {
        const header = request.headers['x-user-id'];
        return typeof header === 'string' ? header : null;
      },
    },
  });
  return { app, db };
}

const body = {
  alias: 'BBVA',
  holderName: 'Ana López',
  holderType: 'company' as const,
  clabe: VALID_CLABE,
};

describe('bank account routes', () => {
  it('registers the session business and returns the last four digits (AC3, AC4, BR1)', async () => {
    const calls: CreateBankAccountInput[] = [];
    const { app, db } = setup({
      async createBankAccount(input) {
        calls.push(input);
        return { id: PEY_ID, codiStatus: 'PENDING' };
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/bank-account',
      headers: { 'x-user-id': 'user-a' },
      payload: body,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      alias: 'BBVA',
      holderName: 'Ana López',
      holderType: 'company',
      clabeLast4: '7899',
      status: 'pending',
    });
    expect(response.json()).not.toHaveProperty('clabe');
    expect(calls).toEqual([
      { alias: 'BBVA', name: 'Ana López', clabe: VALID_CLABE, entity: 'BUSINESS' },
    ]);

    const row = db
      .prepare('SELECT peyBankAccountId FROM businesses WHERE userId = ?')
      .get('user-a') as {
      peyBankAccountId: string;
    };
    expect(row.peyBankAccountId).toBe(PEY_ID);

    const read = await app.inject({
      method: 'GET',
      url: '/bank-account',
      headers: { 'x-user-id': 'user-a' },
    });
    expect(read.statusCode).toBe(200);
    expect(read.json()).toEqual(response.json());
    await app.close();
  });

  it('stores active when Pey already approved the account', async () => {
    const { app } = setup({
      async createBankAccount() {
        return { id: PEY_ID, codiStatus: 'ACTIVE' };
      },
    });
    const response = await app.inject({
      method: 'POST',
      url: '/bank-account',
      headers: { 'x-user-id': 'user-a' },
      payload: { ...body, holderType: 'person' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ status: 'active', holderType: 'person' });
    await app.close();
  });

  it('rejects a bad check digit before calling Pey (AC2, BR2)', async () => {
    const calls: unknown[] = [];
    const { app, db } = setup({
      async createBankAccount(input) {
        calls.push(input);
        return { id: PEY_ID, codiStatus: 'PENDING' };
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/bank-account',
      headers: { 'x-user-id': 'user-a' },
      payload: { ...body, clabe: '012180001234567890' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: { code: 'invalid_clabe' } });
    expect(calls).toHaveLength(0);
    const row = db
      .prepare('SELECT bankAccountStatus, peyBankAccountId FROM businesses WHERE userId = ?')
      .get('user-a') as { bankAccountStatus: string; peyBankAccountId: string | null };
    expect(row.bankAccountStatus).toBe('none');
    expect(row.peyBankAccountId).toBeNull();
    await app.close();
  });

  it('leaves the account unsaved when Pey rejects the bank (AC5, BR3)', async () => {
    const { app, db } = setup({
      async createBankAccount() {
        const error = new Error('pey_invalid_request') as Error & { code: string; peyType: string };
        error.code = 'pey_invalid_request';
        error.peyType = 'INVALID_CLABE';
        throw error;
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/bank-account',
      headers: { 'x-user-id': 'user-a' },
      payload: body,
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({ error: { code: 'bank_not_supported' } });
    expect(JSON.stringify(response.json())).not.toContain('INVALID_CLABE');
    const row = db
      .prepare('SELECT bankAccountStatus, peyBankAccountId FROM businesses WHERE userId = ?')
      .get('user-a') as { bankAccountStatus: string; peyBankAccountId: string | null };
    expect(row).toEqual({ bankAccountStatus: 'none', peyBankAccountId: null });
    await app.close();
  });

  it('leaves no partial account when Pey is unreachable (AC9)', async () => {
    const { app, db } = setup({
      async createBankAccount() {
        throw Object.assign(new Error('timeout talking to pey'), { code: 'pey_unavailable' });
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/bank-account',
      headers: { 'x-user-id': 'user-a' },
      payload: body,
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: { code: 'pey_unavailable' } });
    expect(JSON.stringify(response.json())).not.toContain('timeout');
    const row = db
      .prepare('SELECT bankAccountStatus, peyBankAccountId FROM businesses WHERE userId = ?')
      .get('user-a') as { bankAccountStatus: string; peyBankAccountId: string | null };
    expect(row).toEqual({ bankAccountStatus: 'none', peyBankAccountId: null });
    await app.close();
  });

  it('rejects a second account while one is pending (AC6, BR4)', async () => {
    let calls = 0;
    const { app, db } = setup({
      async createBankAccount() {
        calls += 1;
        return { id: PEY_ID, codiStatus: 'PENDING' };
      },
    });

    const headers = { 'x-user-id': 'user-a' };
    const first = await app.inject({
      method: 'POST',
      url: '/bank-account',
      headers,
      payload: body,
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/bank-account',
      headers,
      payload: { ...body, clabe: OTHER_CLABE, alias: 'Other' },
    });
    expect(isValidClabe(OTHER_CLABE)).toBe(true);
    expect(second.statusCode).toBe(409);
    expect(second.json()).toEqual({ error: { code: 'account_already_registered' } });
    expect(calls).toBe(1);

    const row = db
      .prepare('SELECT clabeLast4, bankAlias FROM businesses WHERE userId = ?')
      .get('user-a') as {
      clabeLast4: string;
      bankAlias: string;
    };
    expect(row).toEqual({ clabeLast4: '7899', bankAlias: 'BBVA' });
    await app.close();
  });

  it('does not call Pey twice when the same owner double-submits (AC10)', async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    const { app } = setup({
      async createBankAccount() {
        calls += 1;
        await gate;
        return { id: PEY_ID, codiStatus: 'PROCESSING' };
      },
    });

    const headers = { 'x-user-id': 'user-a' };
    const first = app.inject({ method: 'POST', url: '/bank-account', headers, payload: body });
    const second = app.inject({
      method: 'POST',
      url: '/bank-account',
      headers,
      payload: { ...body, clabe: OTHER_CLABE },
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(calls).toBe(1);
    release();

    const [left, right] = await Promise.all([first, second]);
    expect(left.statusCode).toBe(201);
    expect(right.statusCode).toBe(201);
    expect(left.json()).toMatchObject({ status: 'pending', clabeLast4: '7899' });
    expect(right.json()).toEqual(left.json());
    expect(calls).toBe(1);
    await app.close();
  });

  it('does not let another user read or replace the account (AC8)', async () => {
    const { app, db } = setup({
      async createBankAccount() {
        return { id: PEY_ID, codiStatus: 'PENDING' };
      },
    });

    await app.inject({
      method: 'POST',
      url: '/bank-account',
      headers: { 'x-user-id': 'user-a' },
      payload: body,
    });

    const otherRead = await app.inject({
      method: 'GET',
      url: '/bank-account',
      headers: { 'x-user-id': 'user-b' },
    });
    expect(otherRead.statusCode).toBe(200);
    expect(otherRead.json()).toMatchObject({ alias: null, status: 'none' });

    const otherWrite = await app.inject({
      method: 'POST',
      url: '/bank-account',
      headers: { 'x-user-id': 'user-b' },
      payload: { ...body, alias: 'Stolen', clabe: OTHER_CLABE },
    });
    expect(otherWrite.statusCode).toBe(201);
    expect(otherWrite.json()).toMatchObject({ alias: 'Stolen' });

    const owner = db.prepare('SELECT bankAlias FROM businesses WHERE userId = ?').get('user-a') as {
      bankAlias: string;
    };
    expect(owner.bankAlias).toBe('BBVA');
    await app.close();
  });

  it('keeps the full CLABE out of the row and the logs (AC7)', async () => {
    const lines: string[] = [];
    const { app, db } = setup(
      {
        async createBankAccount() {
          return { id: PEY_ID, codiStatus: 'PENDING' };
        },
      },
      { stream: { write: (message) => lines.push(message) } },
    );

    const response = await app.inject({
      method: 'POST',
      url: '/bank-account',
      headers: { 'x-user-id': 'user-a' },
      payload: body,
    });
    expect(response.statusCode).toBe(201);

    const row = db.prepare('SELECT * FROM businesses WHERE userId = ?').get('user-a');
    expect(JSON.stringify(row)).not.toContain(VALID_CLABE);
    expect(JSON.stringify(row)).toContain('7899');
    expect(lines.join('\n')).not.toContain(VALID_CLABE);
    expect(JSON.stringify(response.json())).not.toContain(VALID_CLABE);
    await app.close();
  });

  it('requires a session user', async () => {
    const { app } = setup({
      async createBankAccount() {
        return { id: PEY_ID, codiStatus: 'PENDING' };
      },
    });
    const response = await app.inject({ method: 'POST', url: '/bank-account', payload: body });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: { code: 'unauthenticated' } });
    await app.close();
  });
});
