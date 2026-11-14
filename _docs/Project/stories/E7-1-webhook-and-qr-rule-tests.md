# E7-1 Webhook and QR rule tests

| | |
|---|---|
| **Epic** | E7 Quality, accessibility and demo |
| **Sprint** | S2 |
| **Labels** | `story`, `E7`, `backend`, `testing` |
| **Status** | Draft |
| **PRD refs** | AGENTS.md (tests), FR-1b, FR-2, FR-4 |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As a developer, I have automated tests for signature, dedupe, QR validation and user isolation running in CI, so that the money and privacy rules cannot break unnoticed.

## Context

AGENTS.md requires tests for webhook handling (signature, dedupe) and QR creation rules. Each story writes its own tests; this story makes the suite complete, shared and enforced. It also verifies that every AC of S1-S2 stories has at least one test.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-8, E2-2, E2-4, E3-1, E3-2 | the behavior under test |
| Blocks | E7-6 | security review relies on it |

## DB schema

None.

## Acceptance criteria

- **AC1** Webhook tests MUST cover: valid signature, invalid signature, tampered body, old timestamp, duplicate `webhook-id`, duplicate `transactionId`, unknown QR, unknown event type.
- **AC2** QR rule tests MUST cover: generic has amount 0 and no concept or expiration; custom needs amount > 0 and concept; expiration below 360 s rejected and 360 s accepted; amount parsing without floats.
- **AC3** Isolation tests MUST cover two users across every endpoint with a resource id or user data (E1-8).
- **AC4** All Pey calls in tests MUST go through `MockPeyClient` or an HTTP mock; the suite MUST fail if a real network call to `api.pey.mx` is attempted.
- **AC5** Tests MUST run with one command (`npm test`) from a clean checkout, using an in-memory database and fake clocks, with no secrets needed.
- **AC6** A CI workflow MUST run typecheck, lint and tests on every push and pull request. (propuesto, revisar: GitHub Actions)
- **AC7** A traceability check SHOULD verify that every `AC` id in the story specs of this sprint appears in at least one test name or comment. (propuesto, revisar)
- **AC8** The suite SHOULD run in under 60 s. (propuesto, revisar)

## Business rules

```gherkin
Feature: Rules are enforced by tests

  Scenario: BR1 Breaking signature verification fails the build
    Given the signature check is removed from the webhook handler
    When the test suite runs
    Then at least one webhook test fails

  Scenario: BR2 Real network is blocked
    Given a test that calls Pey without a mock
    When the suite runs
    Then it fails with a "network blocked" error

  Scenario: BR3 Unscoped query is caught
    Given a new endpoint returns QRs without business scoping
    When the isolation suite runs
    Then it fails
```

## Tests

This story **is** tests. Deliverables:

| Covers | Level | Deliverable |
|---|---|---|
| AC1, BR1 | integration | `apps/api/test/webhooks.spec.ts` |
| AC2 | unit + integration | `apps/api/test/qr-rules.spec.ts`, `packages/shared/test/money.spec.ts` |
| AC3, BR3 | integration | `apps/api/test/isolation.spec.ts` |
| AC4, BR2 | setup | network guard in the test setup file |
| AC6 | CI | `.github/workflows/ci.yml` |
| AC7 | script | `scripts/check-spec-coverage.ts` |

## Technical notes

- Runner: Vitest (new dependency; ask first, also in E1-1 AC10).
- Shared helpers: `createApp()`, `createTwoUsers()`, `signWebhook()`, payload fixtures.
- Mutation check by hand for BR1: remove the verification once and confirm the suite fails.

## Security & data usage

- Test fixtures use fake data and a throwaway test webhook secret, never the real `.env`.
- CI MUST NOT receive `PEY_API_KEY` or the real webhook secret.

## Out of scope

- End-to-end browser tests, load tests.
- Accessibility tests (E7-2) and the real payment test (E7-3).
- Coverage thresholds.

## Estimate

3 pts: fill gaps, shared helpers, network guard, CI workflow.
