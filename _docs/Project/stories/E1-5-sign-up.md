# E1-5 Sign up

| | |
|---|---|
| **Epic** | E1 Foundations, accounts and isolation |
| **Sprint** | S1 |
| **Labels** | `story`, `E1`, `backend`, `frontend` |
| **Status** | Approved |
| **PRD refs** | FR-1, FR-1b |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As a new owner, I create an account with email and password, so that I get my own private workspace.

## Context

Each user owns exactly one workspace (business). Sign up creates both. Onboarding of the business profile follows in E1-7. Password reset, email verification and social login are out of the MVP (PRD FR-1).

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-1, E1-3, E1-4 | workspace, i18n, tables |
| Blocks | E1-6, E1-7 | need an account |

## DB schema

Uses `users` and `businesses` from E1-4. No new columns. Sign up inserts one `users` row and one empty `businesses` row in **one transaction**.

## Acceptance criteria

- **AC1** `POST /auth/signup` MUST accept `email` and `password` and create a user and an empty business atomically.
- **AC2** The email MUST be validated as an email and stored lowercased and trimmed.
- **AC3** The password MUST be at least 8 characters.
- **AC4** The password MUST be hashed with argon2id or bcrypt; it MUST NOT be stored or logged in plain text.
- **AC5** A duplicate email MUST be rejected with a clear error.
- **AC6** After a successful sign up the user MUST be logged in (session created as in E1-6) and sent to business onboarding (E1-7). (propuesto, revisar)
- **AC7** Validation errors MUST be shown next to the field, in the active language, and announced to screen readers.
- **AC8** The duplicate-email response SHOULD NOT let an attacker tell which emails are registered. (propuesto, revisar) Trade-off: this hurts usability and is hard without email verification; owner decides.
- **AC9** Sign up SHOULD be rate limited per IP. (propuesto, revisar)
- **AC10** The form MUST be usable by keyboard, with labels and `autocomplete` attributes (`email`, `new-password`).

## Business rules

```gherkin
Feature: Sign up

  Scenario: BR1 Successful sign up
    Given no account exists for "ana@example.com"
    When I sign up with "Ana@Example.com" and a valid password
    Then an account exists for "ana@example.com"
    And the account has exactly one empty business
    And I am logged in

  Scenario: BR2 Short password rejected
    When I sign up with a password of 7 characters
    Then I see a password length error
    And no account is created

  Scenario: BR3 Duplicate email rejected
    Given an account exists for "ana@example.com"
    When I sign up with "ana@example.com"
    Then I see an email-already-registered error
    And no second account is created

  Scenario: BR4 Account and business are all-or-nothing
    Given creating the business fails
    When I sign up
    Then no user row is left behind
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1, AC2, AC6, BR1 | integration | "Successful sign up" (email normalized, business created, session cookie set) |
| AC3, BR2 | unit + integration | "Short password rejected" |
| AC4 | integration | stored hash is not the password and verifies with the hasher |
| AC5, BR3 | integration | "Duplicate email rejected" |
| BR4 | integration | "Account and business are all-or-nothing" |
| AC7, AC10 | component | form shows localized field errors, labels present |
| AC9 | integration | "6th attempt in a minute returns 429" (limit value propuesto) |

## Technical notes

- Request schema (zod) in `packages/shared`: `{ email: string, password: string }`.
- Responses: `201 { user: { id, email } }`; errors `400 validation_error`, `409 email_taken`, `429 rate_limited`, each with a stable `code`.
- Hasher: argon2id preferred (`argon2` package, new dependency; ask first).
- Compare the email after normalizing, and rely on the DB unique index to resolve races.

## Security & data usage

- Collects email and password. The password MUST NOT appear in logs, error reports or the database.
- Email is personal data: used only to identify the account. No marketing use; not shared with Pey.
- CSRF protection applies to this state-changing endpoint (FR-1).

## Out of scope

- Email verification, password reset, social login, 2FA.
- Business name, logo, color (E1-7) and bank account (E1-9).
- Password strength meter and breached-password checks.

## Estimate

3 pts: endpoint, transaction, hashing, form UI, tests. Grows if user enumeration protection (AC8) is required.
