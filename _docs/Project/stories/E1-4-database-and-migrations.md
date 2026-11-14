# E1-4 Database and migrations

| | |
|---|---|
| **Epic** | E1 Foundations, accounts and isolation |
| **Sprint** | S1 |
| **Labels** | `story`, `E1`, `backend` |
| **Status** | Approved |
| **PRD refs** | §9 Data model, FR-1b, FR-5 |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As a developer, I have SQLite with `users`, `sessions`, `businesses`, `qrs` and `payments`, so that every feature has a persistent, versioned schema.

## Context

PRD §9 gives a draft data model. This story turns it into the real Drizzle schema and migrations. Each later story adds columns through new migrations; this one lays the base and the conventions (integer cents, `businessId` scoping).

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-1 | workspace, env |
| Blocks | E1-5, E1-6, E1-7, E1-9, E2-2, E3-2 | they read and write these tables |

## DB schema

SQLite via Drizzle. Types shown as SQL for clarity. Money in integer cents; times as integer epoch ms (propuesto, revisar).

```sql
users(
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,          -- stored lowercased
  passwordHash  TEXT NOT NULL,
  createdAt     INTEGER NOT NULL
)

sessions(
  id         TEXT PRIMARY KEY,                 -- opaque random token hash (see E1-6)
  userId     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expiresAt  INTEGER NOT NULL,
  createdAt  INTEGER NOT NULL
)
CREATE INDEX sessions_user ON sessions(userId);

businesses(
  id                TEXT PRIMARY KEY,
  userId            TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT,                      -- filled in E1-7
  logoUrl           TEXT,
  color             TEXT,
  peyBankAccountId  TEXT                       -- filled in E1-9
)

qrs(
  id            TEXT PRIMARY KEY,
  businessId    TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('generic','custom')),
  amountCents   INTEGER NOT NULL DEFAULT 0 CHECK (amountCents >= 0),
  concept       TEXT,
  peyQrId       TEXT,
  qrString      TEXT,
  expiresAt     INTEGER,
  walletStatus  TEXT NOT NULL DEFAULT 'none' CHECK (walletStatus IN ('none','apple','google')),
  active        INTEGER NOT NULL DEFAULT 1,
  createdAt     INTEGER NOT NULL,
  CHECK ((type = 'generic' AND amountCents = 0) OR (type = 'custom' AND amountCents > 0 AND concept IS NOT NULL))
)
CREATE INDEX qrs_business ON qrs(businessId);

payments(
  id                 TEXT PRIMARY KEY,
  qrId               TEXT NOT NULL REFERENCES qrs(id),
  peyTransactionId   TEXT NOT NULL UNIQUE,
  webhookId          TEXT UNIQUE,
  amountCents        INTEGER NOT NULL CHECK (amountCents > 0),
  concept            TEXT,
  numRef             TEXT,
  datePaid           INTEGER NOT NULL,
  raw                TEXT NOT NULL,            -- raw webhook JSON
  createdAt          INTEGER NOT NULL
)
CREATE INDEX payments_qr_date ON payments(qrId, datePaid);
```

Migration: `0000_init`. Foreign keys MUST be enabled (`PRAGMA foreign_keys = ON`).

## Acceptance criteria

- **AC1** The five tables MUST exist after running migrations on an empty database.
- **AC2** Migrations MUST run from a clean state with one command (`npm run db:migrate`) and MUST be idempotent.
- **AC3** A seed script MUST create a demo user and business without real secrets (`npm run db:seed`).
- **AC4** `users.email` MUST be unique; `businesses.userId` MUST be unique (one workspace per user).
- **AC5** `payments.peyTransactionId` and `payments.webhookId` MUST be unique.
- **AC6** The `qrs` table MUST reject, at the database level, a generic QR with an amount and a custom QR with amount 0 or no concept.
- **AC7** Amounts MUST be integer cents; no REAL/float columns for money.
- **AC8** Foreign keys MUST be enforced.
- **AC9** Drizzle table types MUST be exported for the API; shared DTO types live in `packages/shared`, not duplicated.
- **AC10** The database file MUST be git-ignored. (propuesto, revisar)

## Business rules

```gherkin
Feature: Schema integrity

  Scenario: BR1 One workspace per user
    Given a user who already has a business
    When another business is inserted for the same user
    Then the insert fails

  Scenario: BR2 QR type rules hold in the database
    When a generic QR is inserted with amountCents 500
    Then the insert fails
    When a custom QR is inserted with amountCents 0
    Then the insert fails

  Scenario: BR3 Payments cannot be duplicated
    Given a payment with peyTransactionId "T1"
    When another payment with peyTransactionId "T1" is inserted
    Then the insert fails
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1, AC2 | integration | "migrations create all tables on a fresh DB; running twice is safe" |
| AC4, BR1 | integration | "One workspace per user" |
| AC6, BR2 | integration | "QR type rules hold in the database" |
| AC5, BR3 | integration | "Payments cannot be duplicated" |
| AC3 | script | seed runs and creates the demo user |

## Technical notes

- Drizzle + `better-sqlite3` (new dependency pair; ask first). Drizzle Kit for migrations.
- Tests use an in-memory SQLite per test file.
- Later stories add columns (E1-9 bank account fields, E1-10 status) by new migrations, never by editing `0000_init`.

## Security & data usage

- Holds personal data: email, password hash, business name, payment records. The `raw` webhook payload MAY contain the payer's data; it MUST NOT be exposed through any API except to the owning business.
- Password hashes only; never plain text.
- The DB file stays local and out of git.

## Out of scope

- Row-level isolation logic (E1-8).
- Bank account columns (E1-9, E1-10) and notification tables.
- Postgres or any production database.

## Estimate

3 pts: schema, constraints, migrations, seed, constraint tests.
