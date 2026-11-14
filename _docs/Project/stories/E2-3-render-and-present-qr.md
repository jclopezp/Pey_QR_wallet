# E2-3 Render and present QR

| | |
|---|---|
| **Epic** | E2 QR creation and display |
| **Sprint** | S1 |
| **Labels** | `story`, `E2`, `frontend` |
| **Status** | Approved |
| **PRD refs** | FR-2, BRAND.md (QR rules) |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, I show the QR full-screen to a customer, so that they can scan it quickly with their banking app.

## Context

Pey recommends rendering the QR on the client from `qrString` instead of using `generateImage` (PRD FR-2, AGENTS.md). The customer scans with a CoDi-capable banking app, often in bright light on a phone held by the owner. Reliability of the scan matters more than looks.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-2, E1-3, E2-2 | tokens, i18n, a QR to show |
| Blocks | E2-4, E2-5, E5-2, E5-3 | reused by list and wallet previews |

## DB schema

None. Reads `qrs.qrString`, `type`, `amountCents`, `concept` from the API.

## Acceptance criteria

- **AC1** The QR MUST be drawn client-side from `qrString`; `generateImage` MUST NOT be used.
- **AC2** The QR MUST be dark modules on a white background with a quiet zone of at least 4 modules, in both light and dark themes (never inverted).
- **AC3** Error correction level SHOULD be at least M. (propuesto, revisar)
- **AC4** A "present" full-screen mode MUST show a large QR, business name and logo, and, for custom QRs, amount and concept.
- **AC5** Present mode SHOULD raise screen brightness where the browser allows and keep the screen awake (Wake Lock API) with graceful fallback. (propuesto, revisar)
- **AC6** Present mode MUST be closable by a visible button and the Escape key; focus MUST return to the trigger.
- **AC7** The QR MUST have a text alternative ("Payment QR code for <business>") and the mode MUST be keyboard accessible.
- **AC8** The QR MUST scale to the viewport without blur (SVG or high-DPI canvas) and MUST stay scannable at the smallest supported width (320 px).
- **AC9** A generic QR MUST be labeled so the owner knows the payer enters the amount; a custom QR MUST show the amount.
- **AC10** If `qrString` is missing or invalid the UI MUST show an error state, not a blank box.
- **AC11** Rendering MUST happen in the browser from the data the API returned; `qrString` MUST NOT be sent to third-party QR services. (propuesto, revisar)

## Business rules

```gherkin
Feature: Show the QR

  Scenario: BR1 QR is always scannable regardless of theme
    Given the app is in dark theme
    When I open a QR
    Then the QR is drawn dark on white with a quiet zone

  Scenario: BR2 Present mode shows what the customer needs
    Given a custom QR for 150.00 MXN with concept "Corte de cabello"
    When I open present mode
    Then I see the QR, the business name, "150.00 MXN" and "Corte de cabello"

  Scenario: BR3 Generic QR explains itself
    Given a generic QR
    When I open present mode
    Then I see that the customer enters the amount

  Scenario: BR4 Leaving present mode
    Given present mode is open
    When I press Escape
    Then present mode closes
    And focus returns to the button that opened it
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1, AC2, BR1 | component | rendered QR has white background, dark modules and quiet zone in both themes |
| AC1, AC8 | unit | decoding the rendered QR (e.g. `jsqr`) returns the original `qrString` |
| AC4, AC9, BR2, BR3 | component | "Present mode shows what the customer needs" |
| AC6, AC7, BR4 | component | keyboard close, focus return, alt text |
| AC10 | component | error state for invalid `qrString` |
| AC5 | manual | brightness / wake lock on a real phone (documented in the PR) |

## Technical notes

- QR library (`qrcode` or `qrcode-generator`) is a new dependency; ask first. Prefer SVG output.
- One reusable `<QrCode value size />` component, used here, in the list (E2-5) and in wallet previews (E5).
- Present mode as a route (`/app/qrs/:id/present`) or a dialog with `aria-modal`; the route works better with the browser back button. (propuesto, revisar)
- Decode-in-test library (`jsqr`) is a dev dependency; ask first.

## Security & data usage

- `qrString` is a payment instruction; showing it to the customer is the purpose. It MUST NOT be written to logs or analytics, and MUST NOT go to external services.
- Wake Lock and fullscreen need no personal data.

## Out of scope

- Creating QRs (E2-2, E2-4), listing and deactivating (E2-5).
- Wallet pass previews (E5).
- Sharing or downloading the QR as an image. (propuesto, revisar)

## Estimate

3 pts: component, decode test, present mode, accessibility. Grows if brightness and wake lock need device testing.
