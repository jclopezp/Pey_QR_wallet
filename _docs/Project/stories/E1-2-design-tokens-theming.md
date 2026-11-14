# E1-2 Design tokens and theming

| | |
|---|---|
| **Epic** | E1 Foundations, accounts and isolation |
| **Sprint** | S1 |
| **Labels** | `story`, `E1`, `frontend` |
| **Status** | Approved |
| **PRD refs** | FR-0 (theme, accessibility), BRAND.md |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As a user, I see the BuzzQR look in light and dark, so that the app is consistent and comfortable in any lighting.

## Context

[BRAND.md](../../BRAND.md) defines palette A (Azul Confianza), type scale and accessibility rules. Every UI story consumes these tokens, so they must exist before screens are built.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-1 | web workspace |
| Blocks | E1-5, E1-6, E1-7, E2-3, E6-* | all UI |

## DB schema

None.

## Acceptance criteria

- **AC1** Colors, type scale and spacing from BRAND.md MUST be defined as CSS variables (design tokens) in one place.
- **AC2** The theme MUST follow the system setting (`prefers-color-scheme`) by default.
- **AC3** The user MUST be able to override the theme with a manual toggle (light / dark / system), and the choice MUST be remembered.
- **AC4** The theme MUST be applied before first paint to avoid a flash of the wrong theme. (propuesto, revisar)
- **AC5** Fonts from BRAND.md MUST be loaded, with a fallback stack.
- **AC6** Text and UI colors MUST meet WCAG 2.2 AA contrast in both themes.
- **AC7** Components MUST NOT hard-code colors; they MUST use tokens, so the palette can be re-themed (final brand is undecided, PRD open question 6).
- **AC8** The QR display area MUST stay dark-on-white in both themes (see E2-3).

## Business rules

```gherkin
Feature: Theme selection

  Scenario: BR1 Follow the system by default
    Given the user has never chosen a theme
    And the operating system is set to dark
    When the app loads
    Then the dark tokens are applied

  Scenario: BR2 Manual choice wins and persists
    Given the operating system is set to dark
    When the user selects "Light" in the toggle
    And reloads the page
    Then the light tokens are applied
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC2, BR1 | component | "Follow the system by default" |
| AC3, BR2 | component | "Manual choice wins and persists" |
| AC6 | automated | contrast check of token pairs in both themes (script or axe) |
| AC7 | lint | no hex colors outside the tokens file (stylelint/grep) (propuesto, revisar) |

## Technical notes

- Tokens as CSS custom properties on `:root` and `[data-theme="dark"]`.
- Persist the choice in `localStorage` under one key; wrap access in try/catch.
- Tailwind is NOT assumed; any styling library is a new dependency and needs approval.

## Security & data usage

- Stores only the theme preference in the browser. No personal data.

## Out of scope

- Final logo and brand colors.
- Component library beyond the tokens and the theme toggle.

## Estimate

3 pts: tokens, toggle, persistence, contrast check.
