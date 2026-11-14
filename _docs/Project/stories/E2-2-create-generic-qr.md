# E2-2 Create generic QR

| | |
|---|---|
| **Epic** | E2 QR creation and display |
| **Sprint** | S1 |
| **Labels** | `story`, `E2`, `backend`, `frontend` |
| **Status** | Approved |
| **PRD refs** | §5 QR types, FR-2 |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, I create a QR with no amount or description in one click, so that I have a permanent QR to show to any customer.

## Context

The generic QR is the primary one: `amount: 0`, no concept, no expiration; the payer enters the amount in their bank app. It is the QR that goes to the wallet. Money goes to the business's own bank account, so that account MUST be `ACTIVE` at Pey.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-4, E1-6, E1-7, E1-9, E2-1 | tables, session, profile, bank account, Pey client |
| Blocks | E2-3, E2-5, E3-2, E5-* | display, list, payments, wallet |
| External | An `ACTIVE` bank account at Pey (up to 5 business days) | real QR creation. Until then, `MockPeyClient` allows the flow end to end |

## DB schema

Inserts into `qrs` (E1-4). No new columns.

| Column | Value for a generic QR |
|---|---|
| `type` | `generic` |
| `amountCents` | `0` |
| `concept` | `NULL` |
| `expiresAt` | `NULL` |
| `peyQrId`, `qrString` | from Pey response |
| `walletStatus` | `none` |
| `active` | `1` |

## Acceptance criteria

- **AC1** `POST /qrs` with `{ type: "generic" }` MUST create a QR for the logged-in user's business; the request MUST NOT contain `amount`, `concept`, `expiration` or a `businessId`.
- **AC2** The API MUST call Pey `POST /codi/qr` with `amount: 0`, the business's `bankAccountId` and `metadata: { qrId, businessId }`.
- **AC3** QR creation MUST be refused unless the business has a name (E1-7) and a bank account with status `active` (E1-9, E1-10), with a clear message for each case.
- **AC4** Our `qrId` MUST be generated before calling Pey so it can be sent in `metadata`.
- **AC5** On success the QR MUST be saved with `peyQrId` and `qrString` and shown on screen (E2-3).
- **AC6** If Pey fails, no QR row MUST remain (or it MUST be marked failed and hidden) and the owner MUST see a retry message. (propuesto, revisar)
- **AC7** The owner SHOULD NOT be able to create more than one active generic QR; if one exists, the UI opens it instead. (propuesto, revisar)
- **AC8** A double-click MUST NOT create two QRs. (propuesto, revisar)
- **AC9** The generic QR MUST have no expiration.
- **AC10** The endpoint MUST be scoped to the session's business (E1-8).
- **AC11** The demo-only fallback (omitting `bankAccountId` to use the API-key account) MUST NOT be reachable for real users; if built, it is a dev/demo flag only and needs the owner's OK (BACKLOG). (propuesto, revisar)

## Business rules

```gherkin
Feature: Create generic QR

  Scenario: BR1 Happy path
    Given I am logged in
    And my business has a name and an active bank account
    When I click "Create generic QR"
    Then Pey is asked for a QR with amount 0 and my bank account id
    And the request metadata has my qrId and businessId
    And the QR is saved under my business
    And I see the QR on screen

  Scenario: BR2 Bank account not ready
    Given my bank account is "pending"
    When I click "Create generic QR"
    Then I see that my account is still being registered and the expected wait
    And Pey is not called

  Scenario: BR3 Profile incomplete
    Given my business has no name
    When I click "Create generic QR"
    Then I am sent to complete my profile

  Scenario: BR4 Client cannot choose amount or business
    When I send POST /qrs with type "generic" and amount 5000
    Then the amount is ignored or the request is rejected
    And the QR is saved with amount 0

  Scenario: BR5 Pey is down
    Given Pey is unreachable
    When I click "Create generic QR"
    Then I see a retry message
    And no QR is listed
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1, AC2, AC4, AC5, BR1 | integration (mocked Pey) | "Happy path" asserts the Pey request body and the saved row |
| AC3, BR2, BR3 | integration | "Bank account not ready", "Profile incomplete" |
| AC1, BR4 | integration | "Client cannot choose amount or business" |
| AC6, BR5 | integration | "Pey is down" leaves no visible QR |
| AC7, AC8 | integration | second create returns the existing QR; concurrent creates yield one |
| AC10 | integration | feeds E1-8 isolation tests |

## Technical notes

- `POST /qrs` body (zod, in `packages/shared`): discriminated union on `type`; E2-4 adds the `custom` variant.
- Flow: insert pending row with new `qrId` -> call Pey -> update with `peyQrId` and `qrString`; on failure delete or mark failed.
- Response: `201 { qr: { id, type, amountCents, concept, qrString, expiresAt, walletStatus, active, createdAt } }`.
- Errors: `profile_incomplete`, `bank_account_not_active`, `pey_unavailable`.

## Security & data usage

- Sends to Pey: our `qrId`, `businessId`, amount, bank account id. No user email.
- `qrString` is a payment instruction, not a secret, but is still only returned to the owning user's session.
- All access scoped by the session's business; foreign resources return 404.

## Out of scope

- Custom QR (E2-4), QR list and deactivate (E2-5), the on-screen rendering itself (E2-3).
- Wallet buttons (E5).
- Editing a QR after creation.

## Estimate

3 pts: endpoint, preconditions, Pey call and compensation, UI button and states.
