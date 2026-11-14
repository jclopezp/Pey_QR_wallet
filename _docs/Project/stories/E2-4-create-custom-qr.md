# E2-4 Create custom QR

| | |
|---|---|
| **Epic** | E2 QR creation and display |
| **Sprint** | S2 |
| **Labels** | `story`, `E2`, `backend`, `frontend` |
| **Status** | Draft |
| **PRD refs** | §5 QR types, FR-2 |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, I create a QR with amount and description for a specific sale, so that the customer pays exactly that amount for that item.

## Context

Custom QR: amount greater than 0 in MXN, concept required, optional expiration of at least 360 s (PRD §5). Shown full-screen with the same present mode as the generic QR (E2-3). Open question 4 (whether custom QRs can go to the wallet mock) does not affect this story.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E2-1, E2-2, E2-3, E1-10 | Pey client, QR endpoint, present mode, active-account guard |
| Blocks | E2-5, E3-2 | list shows it, payments arrive for it |

## DB schema

Inserts into `qrs` (E1-4). No new columns.

| Column | Value for a custom QR |
|---|---|
| `type` | `custom` |
| `amountCents` | integer > 0 |
| `concept` | required text |
| `expiresAt` | epoch ms = now + expiration, or `NULL` |

## Acceptance criteria

- **AC1** `POST /qrs` with `type: "custom"` MUST require `amount` > 0 and `concept`.
- **AC2** `amount` MUST be parsed from a decimal string with at most 2 decimals into integer cents without float math; `0`, negatives, 3+ decimals and non-numbers MUST be rejected.
- **AC3** `concept` MUST be trimmed, 1 to 100 characters. (max propuesto, revisar: depends on Pey's limit)
- **AC4** `expiration`, if present, MUST be an integer number of seconds of at least 360; values below 360 MUST be rejected.
- **AC5** Without `expiration` the QR MUST NOT expire.
- **AC6** An upper bound on the amount SHOULD exist (propuesto, revisar: align with the CoDi per-transaction limit; confirm in Pey docs).
- **AC7** The API MUST call Pey `POST /codi/qr` with the amount, concept, expiration and `metadata: { qrId, businessId }`.
- **AC8** On success the owner MUST land on the present view (E2-3) showing amount, concept and, when set, the expiry time.
- **AC9** Validation errors MUST be shown next to the field in the active language, with the amount formatted in MXN.
- **AC10** The same preconditions as E2-2 apply (named business, `active` bank account, scoped to session).
- **AC11** A double-submit MUST NOT create two QRs. (propuesto, revisar)

## Business rules

```gherkin
Feature: Create custom QR

  Scenario: BR1 Valid custom QR
    When I create a QR of "150.00" with concept "Corte de cabello"
    Then Pey is asked for a QR of 150.00 with that concept and my metadata
    And the QR is saved with amountCents 15000
    And I see it in present mode

  Scenario Outline: BR2 Invalid amounts
    When I create a custom QR with amount "<amount>"
    Then I see an amount error
    And Pey is not called
    Examples:
      | amount |
      | 0      |
      | -5     |
      | 10.999 |
      | abc    |

  Scenario: BR3 Concept is required
    When I create a custom QR with an empty concept
    Then I see a required-field error

  Scenario Outline: BR4 Expiration rule
    When I create a custom QR with expiration "<seconds>" seconds
    Then the result is "<result>"
    Examples:
      | seconds | result   |
      | 359     | rejected |
      | 360     | accepted |
      | (none)  | accepted, never expires |

  Scenario: BR5 No float drift
    When I create a custom QR with amount "0.10"
    Then amountCents is 10
    And the amount sent to Pey is "0.10"
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC2, BR2, BR5 | unit | money parser table test |
| AC1, AC3, BR3 | integration | "Concept is required" and length |
| AC4, AC5, BR4 | integration | "Expiration rule" |
| AC7, AC10, BR1 | integration (mocked Pey) | "Valid custom QR" asserts the Pey request |
| AC8, AC9 | component | form errors, present view content |

## Technical notes

- Money parser in `packages/shared` (reused by history and export): `parseMxn(string) -> cents`, `formatMxn(cents, locale)`.
- Request type extends the discriminated union started in E2-2.
- The exact Pey field name and unit for expiration (seconds vs timestamp) are **propuesto, revisar** until checked against the spec.

## Security & data usage

- `concept` is free text shown to the customer and stored; treat as untrusted (escape on render, no HTML).
- Sent to Pey: amount, concept, `qrId`, `businessId`, bank account id. No user email.

## Out of scope

- Editing a custom QR, templates, product catalog, tips and discounts.
- Adding a custom QR to the wallet (open question 4).
- Reusing or cloning an expired QR. (propuesto, revisar)

## Estimate

3 pts: form, parser, validation, Pey call. Grows if Pey limits differ from assumptions.
