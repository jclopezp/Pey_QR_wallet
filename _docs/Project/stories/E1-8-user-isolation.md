# E1-8 User isolation

| | |
|---|---|
| **Epic** | E1 Foundations, accounts and isolation |
| **Sprint** | S2 |
| **Labels** | `story`, `E1`, `backend` |
| **Status** | Draft |
| **PRD refs** | FR-1b, §10 (cross-user leak) |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, I can only ever see my own data, so that no other user can read or change my QRs, payments or notifications.

## Context

The app is multi-user with one workspace each. A cross-user leak is a top risk (PRD §10). Scoping is done in one place so every later story inherits it, and proven with two-user tests.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-6, E2-2 | session user and a first resource to protect |
| Blocks | E2-5, E3-2, E3-3, E4-* | they use the scoped data layer |

## DB schema

None. Every resource is reachable from `businessId` (`qrs.businessId`; `payments` via `qrs`).

## Acceptance criteria

- **AC1** `businessId` MUST come only from the session, never from path, query, body or headers.
- **AC2** Every read, update and delete of `qrs` and `payments` MUST be filtered by the session's `businessId`.
- **AC3** Requesting another user's resource by id MUST return 404 (not 403), with the same body as a nonexistent id.
- **AC4** Data access MUST go through a scoped repository (`forBusiness(businessId)`) so an unscoped query cannot be written by accident. (propuesto, revisar)
- **AC5** List endpoints MUST NOT include other users' rows, including in counts and totals.
- **AC6** The SSE stream (E3-3) MUST only deliver events for the logged-in business.
- **AC7** The two-user test suite MUST cover every endpoint that takes a resource id or returns user data, and MUST fail if a new endpoint is added without an isolation case. (propuesto, revisar)
- **AC8** Error responses MUST NOT reveal whether a foreign id exists.

## Business rules

```gherkin
Feature: User isolation

  Background:
    Given user A with a QR "qrA" and a payment "payA"
    And user B with a QR "qrB"

  Scenario: BR1 Cannot read foreign resources
    When B requests GET /qrs/qrA
    Then the response is 404
    And the body equals the response for a random unknown id

  Scenario: BR2 Cannot modify foreign resources
    When B requests deactivation of "qrA"
    Then the response is 404
    And "qrA" is still active

  Scenario: BR3 Lists contain only own rows
    When B lists QRs and payments
    Then "qrA" and "payA" are absent
    And totals count only B's rows

  Scenario: BR4 Client cannot choose the business
    When B sends a body or query with businessId of A
    Then the value is ignored
    And only B's data is affected
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC2, AC3, AC8, BR1 | integration | "Cannot read foreign resources" |
| AC2, BR2 | integration | "Cannot modify foreign resources" |
| AC5, BR3 | integration | "Lists contain only own rows" |
| AC1, BR4 | integration | "Client cannot choose the business" |
| AC6 | integration | B's SSE connection never receives A's payment event |
| AC7 | meta | route table check: every route with `:id` or user data has a registered isolation case |

## Technical notes

- `apps/api/src/db/scoped.ts` exposes `forBusiness(db, businessId)` returning QR and payment accessors; raw `db` is not injected into route handlers.
- Fastify `preHandler` sets `request.businessId` once (E1-6).
- Test helper `createTwoUsers()` shared with E7-1.

## Security & data usage

- Protects emails, business data, bank account alias/last 4, QRs and payment records.
- 404 over 403 avoids confirming that a foreign id exists.

## Out of scope

- Roles, teams, staff accounts, sharing a workspace.
- Database-level row security (SQLite has none).

## Estimate

3 pts: scoped layer, refactor of existing endpoints, two-user suite.
