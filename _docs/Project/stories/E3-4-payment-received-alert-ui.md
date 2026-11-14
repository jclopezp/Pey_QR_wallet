# E3-4 "Pago recibido" alert UI

| | |
|---|---|
| **Epic** | E3 Payments and notifications |
| **Sprint** | S2 |
| **Labels** | `story`, `E3`, `frontend` |
| **Status** | Draft |
| **PRD refs** | FR-4, BRAND.md (toast, accessibility) |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, I see a clear banner with the amount and the QR that was paid, plus an optional sound, so that I notice a payment even in a busy shop.

## Context

This is the moment the product promises ("Payment received - $X.XX MXN"). The cashier may be looking at the customer, not the screen, so the alert must be visible, audible if allowed, and accessible. Consumes the `payment.received` events of E3-3.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-2, E1-3, E3-3 | tokens, i18n, event stream |
| Blocks | E5 demo flow, E7-4 | demo |

## DB schema

None. Sound preference is stored in the browser.

## Acceptance criteria

- **AC1** On `payment.received` the app MUST show a banner/toast with "Pago recibido", the amount in MXN and the concept or QR name.
- **AC2** The toast MUST stay visible at least 6 s and MUST be dismissible; hovering or focusing it SHOULD pause the timer. (pause propuesto, revisar)
- **AC3** The toast MUST be announced to screen readers (`role="status"` / `aria-live="polite"`; `assertive` is NOT RECOMMENDED).
- **AC4** The alert MUST NOT rely on sound alone; the visual alert is always shown.
- **AC5** A sound MAY play, MUST be off until the owner enables it (browsers block autoplay), and the choice MUST be remembered. (default propuesto, revisar)
- **AC6** The toast MUST follow BRAND.md and meet WCAG 2.2 AA contrast in both themes.
- **AC7** `prefers-reduced-motion` MUST disable entrance animation.
- **AC8** Several payments in a row MUST stack or queue without losing any.
- **AC9** The alert MUST appear on every `/app` screen, including present mode (E2-3).
- **AC10** Clicking the toast SHOULD open the payment in history when E4 exists; until then it only dismisses. (propuesto, revisar)
- **AC11** Texts MUST come from the i18n files, amount and date formatted for the active locale.

## Business rules

```gherkin
Feature: Payment alert

  Scenario: BR1 Alert shows amount and QR
    Given I am on any app screen with the stream connected
    When a "payment.received" event for 87.50 MXN arrives
    Then I see "Pago recibido" with "$87.50 MXN" and the concept

  Scenario: BR2 Alert survives present mode
    Given I am showing a QR full-screen
    When a payment event arrives
    Then the alert is visible over the present view

  Scenario: BR3 Not sound-only
    Given sound is disabled
    When a payment event arrives
    Then the visual alert is still shown

  Scenario: BR4 Screen reader announcement
    When the toast appears
    Then its text is announced politely

  Scenario: BR5 Burst of payments
    When three events arrive within one second
    Then three alerts are shown or queued, none lost
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1, AC11, BR1 | component | "Alert shows amount and QR" in es and en |
| AC9, BR2 | component | "Alert survives present mode" |
| AC4, AC5, BR3 | component | sound off by default; visual always |
| AC3, BR4 | component + axe | live region role, no violations |
| AC7 | component | reduced motion disables animation |
| AC8, BR5 | component | "Burst of payments" |
| AC2 | component (fake timers) | stays at least 6 s |

## Technical notes

- Global `<ToastHost />` mounted in the app shell, subscribed through `useEvents()` (E3-3).
- Sound file small (< 50 KB), played after a user gesture that enabled sound; an explicit toggle in the header.
- Dedupe by `paymentId` on the client so a reconnect refetch cannot show the same payment twice.

## Security & data usage

- Displays amount and concept only; no payer data. Nothing stored except the sound preference in `localStorage`.

## Out of scope

- Browser push notifications and vibration. (propuesto, revisar)
- Notification history inbox.
- Alert for events other than payments (activation alert is handled in E1-10 using the same host).

## Estimate

3 pts: toast host, a11y, sound toggle, dedupe, tests.
