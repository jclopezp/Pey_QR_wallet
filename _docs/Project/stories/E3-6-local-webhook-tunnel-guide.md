# E3-6 Local webhook tunnel guide

| | |
|---|---|
| **Epic** | E3 Payments and notifications |
| **Sprint** | S2 |
| **Labels** | `story`, `E3`, `docs` |
| **Status** | Draft |
| **PRD refs** | FR-4, §10 (public URL) |
| **Estimate** | 1 pt |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As a developer, I can receive real Pey webhooks on my laptop, so that I can test real payments locally.

## Context

Pey must reach `POST /webhooks/pey` over the public internet; locally that needs a tunnel (cloudflared or ngrok). This is documentation plus one config value.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E3-1 | the endpoint to expose |
| Blocks | E7-3 | real payment test |
| External | Pey dashboard or API to register the webhook URL and obtain the secret | the registration method is unknown to us: **propuesto, revisar** |

## DB schema

None.

## Acceptance criteria

- **AC1** The README MUST document, step by step, how to expose the local API with cloudflared and with ngrok.
- **AC2** The README MUST explain how to register the public URL (`<tunnel>/webhooks/pey`) at Pey and where the webhook secret goes (`PEY_WEBHOOK_SECRET` in `.env`). (exact Pey steps propuesto, revisar)
- **AC3** `.env.example` MUST include `PUBLIC_BASE_URL` (documentation and logging only).
- **AC4** On startup in development, the API SHOULD log the webhook URL it expects, without secrets. (propuesto, revisar)
- **AC5** The guide MUST include a check: send a simulated event (E3-5) through the tunnel and confirm a 200.
- **AC6** The guide MUST warn that the tunnel URL changes on free plans and must be re-registered, and that the tunnel exposes the local API (keep it up only while testing). (propuesto, revisar)
- **AC7** The guide MUST warn that real tests use $0.01 MXN payments and real money (README).
- **AC8** The guide MUST confirm SSE works through the tunnel (no buffering). (propuesto, revisar)

## Business rules

```gherkin
Feature: Local webhook testing

  Scenario: BR1 Follow the guide and receive an event
    Given a developer with a tunnel tool installed
    When they follow the README steps
    Then a signed test event posted to the public URL returns 200
    And the payment appears in the app
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1-AC8, BR1 | manual | a second developer follows the guide from a clean setup; result noted in the PR |
| AC3 | script | `.env.example` contains `PUBLIC_BASE_URL` |

## Technical notes

- Commands: `cloudflared tunnel --url http://localhost:<API_PORT>` and `ngrok http <API_PORT>`.
- Only the API port is tunneled, never the web dev server. (propuesto, revisar)

## Security & data usage

- The tunnel makes a local service public. Only `/webhooks/pey` is meant for outsiders; all other routes are protected by sessions but SHOULD NOT stay exposed longer than needed.
- Never paste the webhook secret or API key into issues, chats or the README.

## Out of scope

- Permanent hosting or deployment (non-goal).
- Automating tunnel startup.

## Estimate

1 pt: write and verify a short guide.
