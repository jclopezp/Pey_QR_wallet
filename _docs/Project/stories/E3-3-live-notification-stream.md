# E3-3 Live notification stream

| | |
|---|---|
| **Epic** | E3 Payments and notifications |
| **Sprint** | S2 |
| **Labels** | `story`, `E3`, `backend`, `frontend` |
| **Status** | Draft |
| **PRD refs** | FR-4, FR-1b |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, I get an alert the moment I'm paid, so that I can hand over the goods knowing the money arrived.

## Context

Payments arrive by webhook on the server; the owner's browser learns about them through a Server-Sent Events stream at `/events` (PRD FR-4). Target: under 5 s from payment to alert (PRD §11). The stream is per logged-in business.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-6, E1-8, E3-2 | session, scoping, the "payment saved" event |
| Blocks | E3-4, E1-10 (activation alert), E4-3 | UI consumers |

## DB schema

None. The bus is in memory (single process, local MVP).

## Acceptance criteria

- **AC1** `GET /events` MUST require a session and MUST respond with `text/event-stream`.
- **AC2** The stream MUST deliver only events whose `businessId` equals the session's.
- **AC3** On a saved payment the server MUST send an event `payment.received` with `{ paymentId, qrId, amountCents, concept, datePaid }` and no `raw` payload.
- **AC4** The server MUST send a heartbeat comment at least every 25 s to keep the connection open through proxies and tunnels. (interval propuesto, revisar)
- **AC5** The browser client MUST reconnect automatically after a drop, with backoff, and MUST refetch the latest payments after reconnecting so missed events are not lost.
- **AC6** Closing the tab or logging out MUST free the server-side connection.
- **AC7** Multiple tabs of the same user MUST each receive the events.
- **AC8** Events MUST be emitted only after the payment is committed (E3-2 AC8).
- **AC9** The connection count per user SHOULD be capped (e.g. 5). (propuesto, revisar)
- **AC10** Payment to alert latency MUST be under 5 s in the local demo.

## Business rules

```gherkin
Feature: Live notifications

  Scenario: BR1 Owner receives their payment event
    Given I am logged in with the stream open
    When a payment for my QR is saved
    Then I receive a "payment.received" event with its amount and QR id

  Scenario: BR2 Other users do not
    Given user B has the stream open
    When a payment for user A's QR is saved
    Then B receives nothing

  Scenario: BR3 Unauthenticated
    When I open /events without a session
    Then the response is 401

  Scenario: BR4 Reconnect recovers missed payments
    Given the stream dropped and a payment was saved meanwhile
    When the client reconnects
    Then it refetches recent payments
    And the missed payment appears
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1, AC3, BR1 | integration | "Owner receives their payment event" |
| AC2, BR2 | integration | "Other users do not" (feeds E1-8) |
| AC1, BR3 | integration | "Unauthenticated" |
| AC5, BR4 | component | reconnect triggers a refetch |
| AC6, AC7 | integration | disconnect frees the subscriber; two tabs both receive |
| AC4 | integration | heartbeat is sent (fake timers) |

## Technical notes

- In-memory pub/sub keyed by `businessId`; Fastify reply with `reply.raw` and `res.write("event: ...\ndata: ...\n\n")`; disable compression and buffering for this route.
- Browser uses `EventSource` (same origin, cookie auth); a small hook `useEvents()` exposes subscriptions to the toast (E3-4) and dashboard (E4-3).
- No event replay in the MVP; the refetch on reconnect is the recovery path. If `Last-Event-ID` replay is wanted it is a new story. (propuesto, revisar)
- Behind a tunnel, check that the tunnel does not buffer SSE (see E3-6).

## Security & data usage

- Authenticated, business-scoped. Events carry only what the alert needs (amount, concept, QR id), not payer details or the raw payload.
- Same-origin cookie auth; no tokens in the URL.

## Out of scope

- Web push or mobile push when the app is closed (post-MVP).
- Persistent notification inbox, event replay.
- Multi-instance fan-out (Redis etc.).

## Estimate

3 pts: stream endpoint, bus, heartbeat, client hook with reconnect, tests.
