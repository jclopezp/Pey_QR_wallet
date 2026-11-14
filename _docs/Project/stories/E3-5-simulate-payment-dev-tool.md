# E3-5 Simulate payment (dev tool)

| | |
|---|---|
| **Epic** | E3 Payments and notifications |
| **Sprint** | S2 |
| **Labels** | `story`, `E3`, `backend`, `frontend` |
| **Status** | Draft |
| **PRD refs** | FR-4, §10 (no Pey test environment) |
| **Estimate** | 2 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As a developer, I test notifications without real money, so that I can build and demo the payment flow without Pey.

## Context

Pey has no test environment; real tests need $0.01 MXN payments (README). The simulate tool posts a **signed** fake `codi.qr.payment_received` through the same webhook path as the real thing, so it exercises signature, dedupe, persistence and SSE.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E3-1, E3-2, E3-3 | webhook, persistence, stream |
| Blocks | E7-4 | demo fallback |

## DB schema

None. Simulated payments are normal rows; they carry a marker inside `raw` (`"simulated": true`) so they can be told apart. (propuesto, revisar)

## Acceptance criteria

- **AC1** The tool MUST exist only when `NODE_ENV !== "production"` **and** `ENABLE_DEV_TOOLS=true`; otherwise the endpoint MUST return 404 and the button MUST NOT render.
- **AC2** `POST /dev/simulate-payment` MUST require a session and accept `{ qrId, amount? }`.
- **AC3** The QR MUST belong to the session's business (404 otherwise).
- **AC4** The server MUST build a payload shaped like Pey's `codi.qr.payment_received`, sign it with `PEY_WEBHOOK_SECRET`, and process it through the real `/webhooks/pey` handler (internal request), not by writing to the database directly.
- **AC5** For a custom QR the amount MUST default to the QR amount; for a generic QR the owner MUST enter an amount.
- **AC6** Each call MUST generate a unique `transactionId` and `webhook-id`, so repeated clicks create repeated payments.
- **AC7** The UI MUST show a visible "Simulated" marker on the tool and on the simulated payment in history. (propuesto, revisar)
- **AC8** The tool MUST NOT call Pey.
- **AC9** A test MUST prove the endpoint is unreachable with the production flag.

## Business rules

```gherkin
Feature: Simulate payment

  Scenario: BR1 Simulated payment goes the real path
    Given dev tools are enabled and I own a custom QR for 50.00
    When I click "Simulate payment"
    Then a signed event is processed by the webhook handler
    And a payment of 5000 cents is saved
    And I see the "Pago recibido" alert

  Scenario: BR2 Disabled in production
    Given NODE_ENV is "production"
    When I call POST /dev/simulate-payment
    Then the response is 404

  Scenario: BR3 Not for other users' QRs
    When I simulate a payment for a QR of another user
    Then the response is 404
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC4, AC5, AC6, BR1 | integration | "Simulated payment goes the real path" |
| AC1, AC9, BR2 | integration | "Disabled in production" |
| AC3, BR3 | integration | "Not for other users' QRs" (feeds E1-8) |
| AC7 | component | marker rendered |

## Technical notes

- Reuse `signWebhook()` from E3-1 and the payload builder from E3-2 fixtures; call the handler with `app.inject`.
- Button on the QR present screen and list, rendered only if `/config` reports dev tools enabled.
- Add `ENABLE_DEV_TOOLS` to `.env.example` (default false).

## Security & data usage

- Uses the webhook secret server-side only; never exposed to the browser.
- A forged-payment endpoint is dangerous if deployed: the double guard (env flag and NODE_ENV) and test AC9 exist for that reason.
- Fake payments MUST NOT be mixed into real totals in a production database; the flag is off there.

## Out of scope

- Simulating `bank-account.updated`. (propuesto, revisar)
- Load or fuzz testing of the webhook.
- Any production use.

## Estimate

2 pts: endpoint, payload builder, UI button, guards.
