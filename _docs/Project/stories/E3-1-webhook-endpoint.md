# E3-1 Webhook endpoint

| | |
|---|---|
| **Epic** | E3 Payments and notifications |
| **Sprint** | S2 |
| **Labels** | `story`, `E3`, `backend` |
| **Status** | Draft |
| **PRD refs** | FR-4, FR-1b, §10 (replayed webhooks) |
| **Estimate** | 5 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As the system, I receive Pey events safely, so that only genuine, non-duplicated events change our data.

## Context

Pey calls `POST /webhooks/pey` for `codi.qr.payment_received` and `bank-account.updated`. The endpoint is public (no session), so the signature is its only protection. Pey follows the Standard Webhooks scheme. Duplicates and replays happen and MUST NOT double-count money.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-4 | tables |
| Blocks | E1-10, E3-2, E3-5, E3-6, E7-1 | all event handling |
| External | `PEY_WEBHOOK_SECRET`; webhook registered at Pey with our public URL | needed for real events; the tests use a known test secret |

## DB schema

New migration `0003_webhook_events` (propuesto, revisar: needed to dedupe events that are not payments, e.g. bank account updates):

```sql
webhook_events(
  id          TEXT PRIMARY KEY,   -- the webhook-id header
  type        TEXT NOT NULL,
  receivedAt  INTEGER NOT NULL,
  outcome     TEXT NOT NULL CHECK (outcome IN ('processed','ignored','failed'))
)
```

`payments.webhookId` and `payments.peyTransactionId` keep their UNIQUE constraints from E1-4.

## Acceptance criteria

- **AC1** `POST /webhooks/pey` MUST be reachable without a session and MUST be exempt from CSRF; it MUST be the only such endpoint besides auth and health.
- **AC2** The handler MUST verify the Standard Webhooks signature (`webhook-id`, `webhook-timestamp`, `webhook-signature`, HMAC-SHA256 over `id.timestamp.rawBody` with the secret) using the **raw** request body.
- **AC3** The signature comparison MUST be constant-time.
- **AC4** A request with a missing or invalid signature MUST be rejected with 401 and MUST NOT touch the database.
- **AC5** A timestamp outside a tolerance (5 minutes, propuesto, revisar) MUST be rejected to stop replays.
- **AC6** A repeated `webhook-id` MUST be acknowledged with 200 and MUST NOT be processed again.
- **AC7** The body MUST be validated with a zod schema; an unknown event type MUST be recorded as `ignored` and answered 200.
- **AC8** An event for an unknown QR or bank account MUST be logged, recorded as `ignored`, and answered 200 (PRD FR-1b).
- **AC9** The handler MUST dispatch by event type to handlers registered by E3-2 (payments) and E1-10 (bank account).
- **AC10** A handler failure MUST return 5xx so Pey retries, and MUST NOT leave a `processed` mark. (propuesto, revisar)
- **AC11** The secret and the raw signature MUST NOT be logged.
- **AC12** The response SHOULD be fast (under 2 s) since slow responses can cause Pey retries. (propuesto, revisar)

## Business rules

```gherkin
Feature: Pey webhook endpoint

  Scenario: BR1 Valid signed event is accepted
    Given a payload signed with the webhook secret and a fresh timestamp
    When it is posted to /webhooks/pey
    Then the response is 200
    And the event is dispatched to its handler

  Scenario: BR2 Invalid signature is rejected
    Given a payload signed with the wrong secret
    When it is posted to /webhooks/pey
    Then the response is 401
    And nothing is written to the database

  Scenario: BR3 Tampered body is rejected
    Given a valid signature for body X
    When body Y is posted with that signature
    Then the response is 401

  Scenario: BR4 Duplicate webhook-id
    Given an event with webhook-id "w1" was processed
    When "w1" is posted again
    Then the response is 200
    And no second record is created

  Scenario: BR5 Old timestamp
    Given a correctly signed event with a timestamp 10 minutes old
    When it is posted
    Then the response is 401

  Scenario: BR6 Unknown QR
    Given a signed payment event for a QR we do not have
    When it is posted
    Then the response is 200
    And the event is logged as ignored
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC2, AC3, BR1 | integration | "Valid signed event is accepted" |
| AC4, BR2, BR3 | integration | "Invalid signature is rejected", "Tampered body is rejected" |
| AC5, BR5 | integration (fake clock) | "Old timestamp" |
| AC6, BR4 | integration | "Duplicate webhook-id" |
| AC7, AC8, BR6 | integration | "Unknown QR", unknown event type |
| AC10 | integration | handler throws -> 5xx and no `processed` row |
| AC11 | integration | logs do not contain the secret |

Fixtures: a `signWebhook(body, secret, timestamp)` helper shared with E3-5 and E7-1.

## Technical notes

- Raw body: register a content-type parser that keeps the raw `Buffer` for this route; parse JSON after verification.
- Secret format follows Standard Webhooks (`whsec_<base64>`); confirm against Pey's docs. (propuesto, revisar)
- Use the `standardwebhooks` package or a small own implementation; the package is a new dependency and needs approval. Own implementation is about 30 lines with `node:crypto`.
- Insert the `webhook_events` row and run the handler in one DB transaction so a crash cannot mark an event processed without its effects.

## Security & data usage

- Public endpoint: signature is the only gate. Reject before parsing or touching data. Do not echo the payload in error responses.
- The payload can contain payer data (name, account hints); it is stored only in `payments.raw`, visible only to the owning business.
- Rate limiting SHOULD apply at the edge (tunnel/proxy), not by IP in the app, because Pey's IPs are shared. (propuesto, revisar)

## Out of scope

- Payment persistence logic (E3-2) and bank account logic (E1-10); this story only provides the verified, deduped entry point and dispatch.
- Retrying outbound calls to Pey.
- IP allow-listing of Pey.

## Estimate

5 pts: raw body handling, signature scheme, replay window, dedupe transaction, dispatch, thorough tests. This is the security-critical story; do not under-test it.
