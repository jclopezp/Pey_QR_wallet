# E2-5 My QRs list

| | |
|---|---|
| **Epic** | E2 QR creation and display |
| **Sprint** | S2 |
| **Labels** | `story`, `E2`, `backend`, `frontend` |
| **Status** | Draft |
| **PRD refs** | FR-2 |
| **Estimate** | 2 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, I see my QRs, open one, and deactivate or hide one, so that I can find the right QR and remove the ones I no longer use.

## Context

After a few sales the owner has one generic QR and several custom ones. The list is how they get back to present mode and how they retire a QR. Deactivating is local: payments that still arrive for a deactivated QR are real money and MUST still be recorded.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E2-2, E2-3, E2-4, E1-8 | QRs exist, present mode, scoped data layer |
| Blocks | E4-2, E5-4 | QR filter, wallet status in list |

## DB schema

Uses `qrs.active` (E1-4). No new columns.

## Acceptance criteria

- **AC1** `GET /qrs` MUST return the logged-in business's QRs, newest first.
- **AC2** Each row MUST show type, amount (MXN), concept, status (`active`, `expired`, `inactive`), and created date.
- **AC3** Status `expired` MUST be derived from `expiresAt < now`, not stored.
- **AC4** Opening a QR MUST show its present view (E2-3).
- **AC5** `PATCH /qrs/:id` with `{ active: false }` MUST deactivate; the QR MUST disappear from the default list and be shown under a "show inactive" filter. (propuesto, revisar)
- **AC6** Reactivating an inactive, non-expired QR SHOULD be possible. (propuesto, revisar)
- **AC7** Deactivation MUST NOT delete the QR or its payments.
- **AC8** Present mode of an inactive or expired QR MUST show a clear warning that it may still accept payments, since Pey may not stop it. (propuesto, revisar)
- **AC9** An empty list MUST show an empty state with a call to create the first QR.
- **AC10** Foreign ids MUST return 404 (E1-8).
- **AC11** The list SHOULD be paginated beyond 50 rows. (propuesto, revisar)

## Business rules

```gherkin
Feature: QR list

  Scenario: BR1 List shows my QRs newest first
    Given I have a generic QR and two custom QRs
    When I open "My QRs"
    Then I see 3 rows, newest first, each with type, amount, concept, status and date

  Scenario: BR2 Deactivate hides but keeps history
    Given a custom QR with 2 recorded payments
    When I deactivate it
    Then it leaves the default list
    And its 2 payments are still in my history

  Scenario: BR3 Expired is derived
    Given a custom QR whose expiry time has passed
    Then its status is "expired"

  Scenario: BR4 Late payment on an inactive QR is kept
    Given a deactivated QR
    When Pey reports a payment for it
    Then the payment is recorded

  Scenario: BR5 Empty state
    Given I have no QRs
    When I open "My QRs"
    Then I see an empty state with a button to create one
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1, AC2, BR1 | integration | "List shows my QRs newest first" |
| AC3, BR3 | unit (fake clock) | status derivation |
| AC5, AC7, BR2 | integration | "Deactivate hides but keeps history" |
| BR4 | integration | covered with E3-2 |
| AC9, BR5 | component | "Empty state" |
| AC10 | integration | feeds E1-8 |

## Technical notes

- Response items reuse the `Qr` DTO from `packages/shared`; never include other businesses' data.
- Whether Pey supports cancelling a QR is unconfirmed; this story is local-only. If Pey has a cancel call, a follow-up story adds it. (propuesto, revisar)
- Status derivation as a pure function in `packages/shared`.

## Security & data usage

- Returns only the session business's rows; `qrString` is included only for the owner.
- No new personal data.

## Out of scope

- Editing a QR, hard delete, bulk actions, search.
- Cancelling the QR at Pey.
- Wallet status in the list (E5-4).

## Estimate

2 pts: two endpoints, list UI, status function.
