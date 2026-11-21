import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import type { BankAccountView } from '@buzzqr/shared';

/** Columns E1-4 owns. This story only adds the bank-account columns in 0001. */
export const BASE_BUSINESSES_SQL = `
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  name TEXT,
  logoUrl TEXT,
  color TEXT,
  peyBankAccountId TEXT
);
`;

const migrationSql = readFileSync(
  fileURLToPath(new URL('./migrations/0001_bank_account.sql', import.meta.url)),
  'utf8',
);

type BusinessRow = {
  id: string;
  userId: string;
  peyBankAccountId: string | null;
  bankAlias: string | null;
  bankHolderName: string | null;
  bankHolderType: string | null;
  clabeLast4: string | null;
  bankAccountStatus: BankAccountView['status'];
};

function columnNames(db: DatabaseSync): Set<string> {
  const rows = db.prepare('PRAGMA table_info(businesses)').all() as Array<{ name: string }>;
  return new Set(rows.map((row) => row.name));
}

/** Applies 0001. Safe to run again: a column that already exists is skipped. */
export function applyBankAccountMigration(db: DatabaseSync): void {
  const present = columnNames(db);
  for (const statement of migrationSql.split(';')) {
    const sql = statement.trim();
    if (!sql) continue;
    const column = /ADD COLUMN\s+(\w+)/i.exec(sql)?.[1];
    if (column && present.has(column)) continue;
    db.exec(sql);
    if (column) present.add(column);
  }
}

export function openDatabase(filename: string): DatabaseSync {
  if (filename !== ':memory:') {
    mkdirSync(dirname(filename), { recursive: true });
  }
  const db = new DatabaseSync(filename);
  db.exec(BASE_BUSINESSES_SQL);
  applyBankAccountMigration(db);
  return db;
}

export function findBusinessByUser(db: DatabaseSync, userId: string): BusinessRow | undefined {
  const row = db
    .prepare(
      `SELECT id, userId, peyBankAccountId, bankAlias, bankHolderName, bankHolderType,
              clabeLast4, bankAccountStatus
       FROM businesses WHERE userId = ?`,
    )
    .get(userId) as BusinessRow | undefined;
  return row;
}

export function toBankAccountView(row: BusinessRow): BankAccountView {
  const holderType =
    row.bankHolderType === 'person' || row.bankHolderType === 'company' ? row.bankHolderType : null;
  return {
    alias: row.bankAlias,
    holderName: row.bankHolderName,
    holderType,
    clabeLast4: row.clabeLast4,
    status: row.bankAccountStatus,
  };
}

export function saveBankAccount(
  db: DatabaseSync,
  input: {
    id: string;
    userId: string;
    peyBankAccountId: string;
    alias: string;
    holderName: string;
    holderType: 'person' | 'company';
    clabeLast4: string;
    status: 'pending' | 'active';
  },
): boolean {
  const result = db
    .prepare(
      `UPDATE businesses
       SET peyBankAccountId = ?,
           bankAlias = ?,
           bankHolderName = ?,
           bankHolderType = ?,
           clabeLast4 = ?,
           bankAccountStatus = ?
       WHERE id = ? AND userId = ? AND bankAccountStatus = 'none'`,
    )
    .run(
      input.peyBankAccountId,
      input.alias,
      input.holderName,
      input.holderType,
      input.clabeLast4,
      input.status,
      input.id,
      input.userId,
    );
  return Number(result.changes) === 1;
}

export function ensureDevBusiness(db: DatabaseSync, userId: string): void {
  if (findBusinessByUser(db, userId)) return;
  db.prepare('INSERT INTO businesses (id, userId, name) VALUES (?, ?, ?)').run(
    randomUUID(),
    userId,
    'Demo',
  );
}
