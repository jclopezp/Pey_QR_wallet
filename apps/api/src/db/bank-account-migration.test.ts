import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { applyBankAccountMigration, BASE_BUSINESSES_SQL } from './bank-account-db';

describe('bank account migration', () => {
  it('adds a default status of none and rejects an unknown holder type', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(BASE_BUSINESSES_SQL);
    applyBankAccountMigration(db);

    db.prepare('INSERT INTO businesses (id, userId, name) VALUES (?, ?, ?)').run(
      randomUUID(),
      'user-1',
      'Ana',
    );

    const row = db.prepare('SELECT bankAccountStatus FROM businesses').get() as {
      bankAccountStatus: string;
    };
    expect(row.bankAccountStatus).toBe('none');

    expect(() => db.prepare(`UPDATE businesses SET bankHolderType = 'ngo'`).run()).toThrow(
      /CHECK constraint failed/,
    );

    db.prepare(`UPDATE businesses SET clabeLast4 = '7899'`).run();
    const stored = db.prepare('SELECT clabeLast4 FROM businesses').get() as { clabeLast4: string };
    expect(stored.clabeLast4).toBe('7899');
  });

  it('can be applied twice', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(BASE_BUSINESSES_SQL);
    applyBankAccountMigration(db);
    expect(() => applyBankAccountMigration(db)).not.toThrow();
  });
});
