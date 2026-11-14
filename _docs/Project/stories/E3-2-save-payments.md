# E3-2 Save payments

| | |
|---|---|
| **Epic** | E3 Payments and notifications |
| **Sprint** | S2 |
| **Labels** | `story`, `E3`, `backend` |
| **Status** | Draft |
| **PRD refs** | FR-4, FR-5, FR-1b |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, each paid QR creates a payment record under my account, so that I have a reliable history of what I received.

## Context

When Pey reports `codi.qr.payment_received`, the handler (registered on the E3-1 dispatcher) maps the event to our QR through `metadata.qrId` (fallback: `codiQrId` -> `qrs.peyQrId`), then to the business, and stores the payment. Only after the record is committed is the live event emitted (E3-3).

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-4, E2-2, E3-1 | tables, QRs, verified dispatcher |
| Blocks | E3-3, E3-4, E4-*, E7-3 | notifications and history |
| External | exact `codi.qr.payment_received` payload (amount format, field names) | **propuesto, revisar** until checked against the Pey spec |

## DB schema

Uses `payments` (E1-4). No new columns.

| Column | Source |
|---|---|
| `qrId` | `metadata.qrId`, else lookup by `codiQrId` |
| `peyTransactionId` | event `transactionId` (UNIQUE) |
| `webhookId` | `webhook-id` header (UNIQUE) |
| `amountCents` | event amount converted without floats |
| `concept` | event concept |
| `numRef` | event `numRef` |
| `datePaid` | event paid date, epoch ms |
| `raw` | verbatim JSON body |

## Acceptance criteria

- **AC1** A valid `codi.qr.payment_received` MUST create exactly one `payments` row linked to the right QR.
- **AC2** The business MUST be derived from the QR, never from the payload alone (a forged `businessId` in `metadata` MUST be ignored if it does not match the QR's business).
- **AC3** `peyTransactionId` MUST be unique: a second event with the same `transactionId` and a different `webhook-id` MUST NOT create a second payment.
- **AC4** The amount MUST be converted to integer cents without float arithmetic; an amount that is not a positive value with at most 2 decimals MUST be rejected as `failed` (5xx not needed; recorded and logged). (propuesto, revisar)
- **AC5** The payment MUST be recorded even if its QR is inactive or expired (the money was paid).
- **AC6** For a custom QR, a paid amount different from the QR amount SHOULD still be recorded and flagged in logs. (propuesto, revisar)
- **AC7** The raw payload MUST be stored in `raw`.
- **AC8** The record and the `webhook_events` mark MUST commit together; the live event MUST be emitted only after commit.
- **AC9** An event for a QR that does not exist MUST be ignored per E3-1 (no payment row).
- **AC10** A payment MUST be visible only to the QR's business (E1-8).

## Business rules

```gherkin
Feature: Save payments

  Scenario: BR1 Payment on a custom QR
    Given a custom QR for 150.00 owned by business A
    When a signed payment_received for 150.00 arrives with that qrId
    Then one payment of 15000 cents exists for that QR
    And an internal "payment saved" event is emitted for business A

  Scenario: BR2 Payment on a generic QR with payer-chosen amount
    Given a generic QR
    When a signed payment_received for 87.50 arrives
    Then one payment of 8750 cents exists

  Scenario: BR3 Same transaction, different webhook
    Given a payment with transactionId "T1" exists
    When an event with transactionId "T1" and a new webhook-id arrives
    Then still one payment exists

  Scenario: BR4 Forged business id
    Given a QR owned by A
    When an event for that QR carries metadata businessId of B
    Then the payment is stored under A

  Scenario: BR5 Late payment on a deactivated QR
    Given a deactivated QR
    When its payment_received arrives
    Then the payment is recorded

  Scenario: BR6 No float drift
    When a payment of "0.10" and another of "0.20" are saved
    Then their total is 30 cents
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1, AC7, AC8, BR1, BR2 | integration | "Payment on a custom QR", "...generic QR" |
| AC3, BR3 | integration | "Same transaction, different webhook" |
| AC2, AC10, BR4 | integration | "Forged business id" |
| AC5, BR5 | integration | "Late payment on a deactivated QR" |
| AC4, BR6 | unit | amount-to-cents conversion table |
| AC9 | integration | unknown QR creates no row |
| AC8 | integration | transaction rolls back on failure and emits nothing |

## Technical notes

- Handler lives in `apps/api/src/webhooks/handlers/paymentReceived.ts`; internal bus `paymentSaved` consumed by E3-3.
- Payload zod schema in `integrations/pey`, shared test fixtures with E3-5.
- Amount helper from `packages/shared` (E2-4).

## Security & data usage

- Stores financial transaction data: amount, concept, reference, date, raw payload (may include payer details). Visible only to the owning business; never logged in full.
- Trust boundary: the QR record, not the payload, decides ownership.

## Out of scope

- History UI, filters, totals (E4).
- Reconciliation by polling Pey (E4-5).
- Refunds and reversals.

## Estimate

3 pts: mapping, conversion, transaction, tests. Grows if the real payload lacks `metadata`.
