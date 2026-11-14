# E1-6 Log in and log out

| | |
|---|---|
| **Epic** | E1 Foundations, accounts and isolation |
| **Sprint** | S1 |
| **Labels** | `story`, `E1`, `backend`, `frontend` |
| **Status** | Approved |
| **PRD refs** | FR-1 |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, I log in and out securely, so that only I can reach my workspace.

## Context

Sessions are server-side, carried by an httpOnly cookie (PRD FR-1). All `/app` routes and API endpoints require a session except `/`, `/signup`, `/login` and the Pey webhook.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-4, E1-5 | `sessions` table, accounts |
| Blocks | E1-7, E1-8, E2-2, E3-3 | need an authenticated user |

## DB schema

Uses `sessions` from E1-4. The cookie holds a random token; the `sessions.id` stores its **SHA-256 hash** so a database leak does not expose live sessions. (propuesto, revisar)

No new columns. Expired rows are deleted when encountered and by a periodic cleanup. (propuesto, revisar)

## Acceptance criteria

- **AC1** `POST /auth/login` with valid credentials MUST create a session and set a cookie that is `HttpOnly`, `SameSite=Lax` (or `Strict`) and `Secure` outside local development.
- **AC2** Invalid credentials MUST return the same generic error whether the email exists or not.
- **AC3** Login attempts MUST be rate limited (per IP and per email).
- **AC4** `POST /auth/logout` MUST delete the session server-side and clear the cookie.
- **AC5** Every API endpoint except `/auth/signup`, `/auth/login`, `/health` and the Pey webhook MUST return 401 without a valid session.
- **AC6** Unauthenticated visits to `/app` routes MUST redirect to `/login`.
- **AC7** State-changing requests MUST be protected against CSRF.
- **AC8** `GET /auth/me` MUST return the current user, or 401. The web uses it to restore state on load.
- **AC9** A session MUST expire after a fixed period (7 days, propuesto, revisar) and an expired session MUST be rejected.
- **AC10** The session token MUST be regenerated on login to prevent fixation. (propuesto, revisar)
- **AC11** The password MUST NOT be logged on any path, including failed logins.

## Business rules

```gherkin
Feature: Login and logout

  Scenario: BR1 Valid login
    Given an account "ana@example.com" with password "correct-horse"
    When I log in with those credentials
    Then I receive an httpOnly session cookie
    And GET /auth/me returns my user

  Scenario: BR2 Wrong password and unknown email look the same
    When I log in with a wrong password
    And I log in with an unknown email
    Then both responses have the same status and error code

  Scenario: BR3 Rate limit
    Given 5 failed logins for the same email within a minute
    When I try a 6th time
    Then I get a 429 response

  Scenario: BR4 Logout kills the session
    Given I am logged in
    When I log out
    Then the old cookie no longer authenticates any request

  Scenario: BR5 Protected routes
    Given I am not logged in
    When I request a protected endpoint
    Then I get 401
    When I open "/app" in the browser
    Then I am redirected to "/login"
```

Limits (5 per minute, 7-day session) are propuesto, revisar.

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1, AC8, BR1 | integration | "Valid login" (cookie flags checked) |
| AC2, BR2 | integration | "Wrong password and unknown email look the same" |
| AC3, BR3 | integration | "Rate limit" |
| AC4, BR4 | integration | "Logout kills the session" |
| AC5, AC6, BR5 | integration + e2e | "Protected routes" over a table of all endpoints |
| AC7 | integration | state-changing request without the CSRF token is rejected |
| AC9 | integration | expired session rejected (fake clock) |
| AC11 | integration | log output of a failed login does not contain the password |

## Technical notes

- Fastify plugins: `@fastify/cookie` and `@fastify/rate-limit`; CSRF via `@fastify/csrf-protection` or a double-submit token. All new dependencies; ask first.
- An `authenticate` pre-handler decorates `request.user` and `request.businessId`; every later story reads scope from there (see E1-8).
- Web: an auth context that calls `/auth/me`, and a route guard for `/app/*`.
- Error codes: `invalid_credentials`, `rate_limited`, `unauthenticated`, `csrf_invalid`.

## Security & data usage

- Cookie is the only credential; never put the token in `localStorage` or the URL.
- Store only the hash of the session token. Do not log cookies or credentials.
- Constant-time password verification; same response time shape for unknown emails where practical. (propuesto, revisar)

## Out of scope

- "Remember me", multiple device management, session list.
- Password reset, 2FA, social login, account lockout emails.

## Estimate

3 pts: sessions, cookie, rate limit, CSRF, route guard, tests. Grows if CSRF needs a custom scheme.
