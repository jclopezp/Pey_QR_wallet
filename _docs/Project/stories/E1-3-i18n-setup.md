# E1-3 i18n setup (es-MX / en)

| | |
|---|---|
| **Epic** | E1 Foundations, accounts and isolation |
| **Sprint** | S1 |
| **Labels** | `story`, `E1`, `frontend` |
| **Status** | Approved |
| **PRD refs** | FR-0 (bilingual, product name constant), open question 3 |
| **Estimate** | 2 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As a user, I can use the app in Spanish or English, so that I understand every screen.

## Context

Decided: Spanish (Mexico) is the default and English is supported. All copy lives in translation files. BuzzQR is a temporary name, so it is a single constant.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-1 | web workspace |
| Blocks | every UI story | they need `t()` |
| External | i18n library choice | new dependency, needs approval |

## DB schema

None. (A saved language preference per user is out of scope; the choice is stored in the browser.)

## Acceptance criteria

- **AC1** All user-facing text MUST come from translation files (`es-MX` and `en`); no hard-coded strings in components.
- **AC2** The default language MUST be Spanish (es-MX).
- **AC3** A visible language toggle MUST switch the language without a page reload, and the choice MUST be remembered.
- **AC4** The product name MUST come from one constant (`PRODUCT_NAME`) used by UI, page titles and translations.
- **AC5** A missing key MUST fall back to Spanish and MUST be reported in development (console warning). (propuesto, revisar)
- **AC6** A check MUST fail the build if `es-MX` and `en` do not have the same keys. (propuesto, revisar)
- **AC7** The `<html lang>` attribute MUST reflect the active language.
- **AC8** Dates and money MUST be formatted with `Intl` for the active locale (MXN currency). (propuesto, revisar)
- **AC9** API error responses MUST carry a stable `code`; the web maps codes to translated messages (the API does not send prose). (propuesto, revisar)

## Business rules

```gherkin
Feature: Language selection

  Scenario: BR1 Spanish by default
    Given a first-time visitor with no saved language
    When the app loads
    Then texts are shown in Spanish
    And the html lang attribute is "es-MX"

  Scenario: BR2 Switch and remember
    Given the app is shown in Spanish
    When the user switches to English
    And reloads the page
    Then texts are shown in English
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC2, AC7, BR1 | component | "Spanish by default" |
| AC3, BR2 | component | "Switch and remember" |
| AC6 | unit | locale files have identical key sets |
| AC4 | unit | page title uses `PRODUCT_NAME` |

## Technical notes

- Library: `react-i18next` or `@lingui` are options. Either is a new dependency; ask first.
- Keys namespaced by feature (`auth.signup.title`).
- Constant at `apps/web/src/config/product.ts` (or `packages/shared` if the API needs it, e.g. for emails/wallet pass text).

## Security & data usage

- Stores only the language preference in `localStorage`. No personal data.

## Out of scope

- Languages beyond es-MX and en.
- Per-user language saved in the database.
- Translating Pey's own error text.

## Estimate

2 pts: setup, toggle, key parity check.
