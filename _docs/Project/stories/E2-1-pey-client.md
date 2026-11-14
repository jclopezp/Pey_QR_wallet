# E2-1 Pey client

| | |
|---|---|
| **Epic** | E2 QR creation and display |
| **Sprint** | S1 |
| **Labels** | `story`, `E2`, `backend` |
| **Status** | Approved |
| **PRD refs** | FR-2, §9 Pey integration, §10 risks |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As a developer, I call Pey from the API only, through one typed and mockable client, so that the rest of the code never touches HTTP details or the API key.

## Context

Base URL `https://api.pey.mx`, Bearer auth, spec at `https://docs.pey.mx/openapi.json` (AGENTS.md). There is **no Pey test environment**; tests MUST use a mock. The API key arrives 2026-11-14, so the mock comes first and the real client is switched on once the key exists.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-1 | workspace and env loading |
| Blocks | E1-9, E1-10, E2-2, E2-4, E3-5, E4-5 | all Pey calls |
| External | Pey API key; OpenAPI spec | request/response shapes below are **propuesto, revisar** until checked against the spec |

## DB schema

None.

## Acceptance criteria

- **AC1** The client MUST live in `apps/api` (`integrations/pey`) and MUST NOT be imported by `apps/web` or `packages/shared`.
- **AC2** The client MUST be defined by an interface (`PeyClient`) with at least `createQr`, `createBankAccount`, `getBankAccount` (more added by later stories), so a mock can replace it.
- **AC3** A `MockPeyClient` MUST exist and be selected by configuration (`PEY_MODE=mock|live`); `live` MUST fail at startup if `PEY_API_KEY` is missing.
- **AC4** The API key MUST be read from env and sent as `Authorization: Bearer <key>`; it MUST NOT be logged, returned in errors, or reach the browser.
- **AC5** `createQr` MUST send `amount`, `concept` (when present), `metadata: { qrId, businessId }` and the business's bank account id, and MUST return `{ peyQrId, qrString }`. (field names propuesto, revisar)
- **AC6** Requests and responses MUST be validated with zod; an unexpected response shape MUST raise a typed error, not crash.
- **AC7** Pey errors MUST be mapped to our own error codes (`pey_invalid_request`, `pey_unauthorized`, `pey_unavailable`, `pey_unknown`) with friendly messages handled by the web via i18n.
- **AC8** Every request MUST have a timeout (10 s, propuesto, revisar) and MUST NOT be retried automatically for non-idempotent calls (QR creation), to avoid duplicate QRs. (propuesto, revisar)
- **AC9** Tests MUST NOT make real Pey calls (AGENTS.md).
- **AC10** Logs SHOULD record method, path, status and duration, never headers or bodies with sensitive data. (propuesto, revisar)

## Business rules

```gherkin
Feature: Pey client

  Scenario: BR1 QR creation request shape
    Given a mocked Pey endpoint
    When createQr is called for a generic QR
    Then the request body has amount 0
    And the metadata contains qrId and businessId
    And the Authorization header is "Bearer <key>"

  Scenario: BR2 Errors are mapped, not leaked
    Given Pey answers 401 with a body that echoes the key
    When createQr is called
    Then a pey_unauthorized error is raised
    And its message does not contain the key

  Scenario: BR3 No blind retries on QR creation
    Given Pey times out on QR creation
    When createQr is called
    Then it fails once with pey_unavailable
    And exactly one request was sent
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC5, BR1 | unit (HTTP mock, e.g. `msw`/`undici` MockAgent) | "QR creation request shape" |
| AC7, AC4, BR2 | unit | "Errors are mapped, not leaked" |
| AC8, BR3 | unit | "No blind retries on QR creation" |
| AC3 | unit | live mode without key fails at startup |
| AC6 | unit | malformed Pey response raises a typed error |
| AC1 | lint/arch | web workspace has no import path to `integrations/pey` |

## Technical notes

- Use Node's built-in `fetch` (no new HTTP dependency). HTTP mocking library is a new dev dependency; ask first.
- Types for Pey payloads inside `integrations/pey`; DTOs we expose live in `packages/shared`.
- One function per Pey endpoint; a small `request()` helper handles auth, timeout, JSON, error mapping.
- Webhook signature verification is NOT part of this client (E3-1).

## Security & data usage

- Handles the app-level API key and passes business data (names, CLABE in E1-9) to Pey. Redact `Authorization` and any CLABE in logs.
- Pey receives only what the call needs; no user emails or passwords.
- No real payment calls in tests (no Pey test environment).

## Out of scope

- Webhook handling (E3-1), transactions sync (E4-5).
- `generateImage`; the QR is drawn client-side from `qrString`.
- Retry/backoff for read-only calls beyond a simple optional retry. (propuesto, revisar)

## Estimate

3 pts: interface, mock, live client, error mapping, tests. Grows if the real spec differs from the assumed shapes.
