# E1-10 Bank account status

| | |
|---|---|
| **Epic** | E1 Foundations, accounts and isolation |
| **Sprint** | S2 |
| **Labels** | `story`, `E1`, `backend`, `frontend` |
| **Status** | Draft |
| **PRD refs** | FR-1c, §10 risks |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, I see whether my receiving account is Pending or Active and I'm told when it's ready, so that I know when I can start creating QRs.

## Context

Registration with Banxico takes up to 5 business days. Until `ACTIVE`, QR creation is blocked with a clear message (E2-2). Pey notifies changes with the `bank-account.updated` webhook; a manual refresh covers a missed webhook.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-9, E2-1, E3-1 | account registered, Pey client, webhook endpoint and signature check |
| Blocks | E2-2 (full guard), E7-3 | real payments need an active account |
| External | Pey event name `bank-account.updated` and `GET /bank-account/{id}` | payload shape is **propuesto, revisar** until checked against the spec |

## DB schema

New migration `0002_bank_account_status_time`:

```sql
ALTER TABLE businesses ADD COLUMN bankAccountStatusUpdatedAt INTEGER;
```

`bankAccountStatus` already exists (E1-9). (propuesto, revisar: the timestamp column, to show "since".)

## Acceptance criteria

- **AC1** The app MUST show a status badge: none, pending, active, or rejected, with text (not color alone).
- **AC2** While `pending`, the UI MUST explain the wait (up to 5 business days) and MUST show creating QRs as unavailable.
- **AC3** The `bank-account.updated` webhook MUST update the matching business's status, found by `peyBankAccountId`.
- **AC4** A "Refresh status" action MUST call Pey `GET /bank-account/{id}` and update the stored status.
- **AC5** When the status changes to `active`, the owner MUST be told: an SSE event plus a banner on next load until dismissed. (propuesto, revisar)
- **AC6** `POST /qrs` MUST return `bank_account_not_active` unless the status is `active`.
- **AC7** If the status is `rejected`, the UI MUST show the reason in plain language when Pey provides one. Re-registering after rejection is out of scope for this story. (propuesto, revisar)
- **AC8** Status MUST only move forward or to `rejected`; a stale event MUST NOT move `active` back to `pending`. (propuesto, revisar)
- **AC9** Unknown bank account ids in webhooks MUST be ignored (logged, 200).
- **AC10** Manual refresh SHOULD be rate limited (e.g. once per 30 s). (propuesto, revisar)

## Business rules

```gherkin
Feature: Bank account status

  Scenario: BR1 Pending blocks QR creation
    Given my account status is "pending"
    When I try to create a QR
    Then I see the message and the expected wait
    And no QR is created

  Scenario: BR2 Webhook activates the account
    Given my account status is "pending"
    When Pey sends a signed "bank-account.updated" with status active for my account
    Then my status becomes "active"
    And I receive a live notification

  Scenario: BR3 Manual refresh recovers a missed webhook
    Given Pey already considers my account active
    And I never received the webhook
    When I click "Refresh status"
    Then my status becomes "active"

  Scenario: BR4 Stale events cannot downgrade
    Given my status is "active"
    When an older event says "pending"
    Then my status stays "active"
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC2, AC6, BR1 | integration | "Pending blocks QR creation" |
| AC3, AC5, AC9, BR2 | integration | "Webhook activates the account" (+ unknown id ignored) |
| AC4, AC10, BR3 | integration (mocked Pey) | "Manual refresh recovers a missed webhook" |
| AC8, BR4 | integration | "Stale events cannot downgrade" |
| AC1, AC7 | component | badge text per status |

## Technical notes

- The webhook handler from E3-1 dispatches on event type; this story registers the `bank-account.updated` handler.
- `GET /bank-account` (E1-9) gains `status` and `statusUpdatedAt`; `POST /bank-account/refresh` triggers the manual sync.
- Status mapping Pey -> ours kept in one function with a table test.

## Security & data usage

- Webhooks are verified by the same signature check as payments (E3-1); unsigned status changes MUST be rejected.
- Stores status and timestamp only; no new personal data.

## Out of scope

- Changing or re-registering an account, multiple accounts.
- Email or push notification of activation (SSE and banner only).

## Estimate

3 pts: webhook handler, refresh, guard, badge and banner.
