# E1-9 Register bank account

| | |
|---|---|
| **Epic** | E1 Foundations, accounts and isolation |
| **Sprint** | S1 |
| **Labels** | `story`, `E1`, `backend`, `frontend` |
| **Status** | Approved |
| **PRD refs** | FR-1c, §10 risks (5 business days) |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, I register the bank account that receives my payments, so that customers' CoDi payments go straight to my account.

## Context

Decision: one app-level Pey API key; each business registers its own account with Pey. Pey registers it with Banxico, which takes **up to 5 business days** (status `PENDING` until `ACTIVE`). A QR can only use an `ACTIVE` account. **Start this first:** the team's and demo accounts should be registered on day 1 of S1, or S2 and the demo can be blocked (BACKLOG, risks).

The Pey key arrives 2026-11-14. Until then the Pey client is mocked (E2-1).

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-4, E1-6, E1-7, E2-1 | tables, session, profile, Pey client |
| Blocks | E1-10, E2-2 | status tracking and QR creation need the account |
| External | Pey API key; `POST /bank-account` in the Pey spec | not yet seen by us; field names below are **propuesto, revisar** until checked against `https://docs.pey.mx/openapi.json` |

## DB schema

New migration `0001_bank_account` on `businesses` (existing column `peyBankAccountId` is kept):

```sql
ALTER TABLE businesses ADD COLUMN bankAlias        TEXT;
ALTER TABLE businesses ADD COLUMN bankHolderName   TEXT;
ALTER TABLE businesses ADD COLUMN bankHolderType   TEXT CHECK (bankHolderType IN ('person','company'));
ALTER TABLE businesses ADD COLUMN clabeLast4       TEXT;      -- only the last 4 digits
ALTER TABLE businesses ADD COLUMN bankAccountStatus TEXT NOT NULL DEFAULT 'none'
  CHECK (bankAccountStatus IN ('none','pending','active','rejected'));
```

The full CLABE is sent to Pey and **not stored** by us (only `clabeLast4`). (propuesto, revisar: store only last 4.) Status values and the `rejected` state depend on Pey's real statuses; update this spec after reading the spec.

## Acceptance criteria

- **AC1** The form MUST collect alias, account holder legal name, person or company, and an 18-digit CLABE.
- **AC2** The CLABE MUST be validated on the client and the server: 18 digits and a correct check digit.
- **AC3** On submit the API MUST call Pey `POST /bank-account` (server side only) and save the returned Pey id in `businesses.peyBankAccountId`.
- **AC4** The business MUST be stored with status `pending` after a successful registration, and the owner MUST see the expected wait (up to 5 business days).
- **AC5** Pey errors (invalid CLABE, bank without CoDi, etc.) MUST be explained in plain language, in the active language; the raw Pey message MUST NOT be shown.
- **AC6** An owner MUST NOT be able to register a second account while one is `pending` or `active`. The API responds `409` with code `account_already_registered` and does not call Pey. Changing the account is out of scope.
- **AC7** The full CLABE MUST NOT be logged or persisted; only the last 4 digits MAY be stored and shown.
- **AC8** The endpoint MUST only act on the logged-in user's business.
- **AC9** If Pey is unreachable, the form MUST show a retry message and MUST NOT leave a half-saved account (no `peyBankAccountId` without a matching status).
- **AC10** Double-submits MUST NOT register the account twice (idempotent per business). A second request for the same business while the first registration is in flight receives that same result and does not call Pey again. After the account is `pending` or `active`, a later request is rejected.

## Business rules

```gherkin
Feature: Register receiving bank account

  Scenario: BR1 Valid registration
    Given I am logged in with a business profile
    When I submit alias, holder name, type and a valid CLABE
    Then Pey is asked to register the account
    And my business shows status "pending"
    And only the last 4 digits of the CLABE are kept

  Scenario: BR2 Invalid CLABE
    When I submit a CLABE with a wrong check digit
    Then I see an invalid-CLABE error
    And Pey is not called

  Scenario: BR3 Pey rejects the account
    Given Pey answers that the bank does not support CoDi
    When I submit a valid-looking CLABE
    Then I see a plain-language explanation
    And my business status stays "none"

  Scenario: BR4 One account at a time
    Given my account status is "pending"
    When I try to register another account
    Then the request is rejected
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC2, BR2 | unit | CLABE validator: valid, wrong length, non-digits, bad check digit |
| AC3, AC4, BR1 | integration (mocked Pey) | "Valid registration" |
| AC5, BR3 | integration (mocked Pey) | "Pey rejects the account" |
| AC6, BR4 | integration | "One account at a time" |
| AC7 | integration | stored row and logs never contain the full CLABE |
| AC9 | integration (Pey timeout) | no partial state |
| AC8 | integration | feeds E1-8 isolation tests |

Tests MUST use the mocked Pey client; real registration is only done by hand for the team and demo accounts.

## Technical notes

- Endpoint `POST /bank-account` (our API) with zod `BankAccountInput`; `GET /bank-account` returns `{ alias, holderName, holderType, clabeLast4, status }`.
- Pey call goes through the typed client (E2-1), never from the browser.
- CLABE check digit: weighted sum with weights 3,7,1 repeating, mod 10 (standard CLABE algorithm). Put in `packages/shared` so web and API share it.
- Map Pey error codes to our own `code` values; add translations in E1-3 files.

## Security & data usage

- Sensitive financial data: account holder legal name and CLABE. They are sent to Pey only, over HTTPS, from the API.
- Do not log request bodies for this endpoint. Do not return the full CLABE after submit.
- Only the owner sees their own alias and last 4 digits (E1-8).
- The Pey API key never leaves the server.

## Out of scope

- Status updates and the "ready" message (E1-10).
- Changing or deleting a registered account, multiple accounts per business.
- Verifying that the CLABE belongs to the holder (Pey/Banxico do this).
- Using the API-key-linked account as a fallback for real users (demo-only flag; needs owner OK, see BACKLOG).

## Estimate

3 pts: form, validator, endpoint, Pey call, error mapping. Grows if Pey's real statuses differ from the draft.
