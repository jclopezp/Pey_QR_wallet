# E1-7 Business profile onboarding

| | |
|---|---|
| **Epic** | E1 Foundations, accounts and isolation |
| **Sprint** | S1 |
| **Labels** | `story`, `E1`, `backend`, `frontend` |
| **Status** | Approved |
| **PRD refs** | FR-1c |
| **Estimate** | 2 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As an owner, I set my business name, optional logo and color after sign up, so that my QR and wallet pass carry my business identity.

## Context

Right after sign up the workspace is empty. Name, logo and color are used on the full-screen QR and on the wallet pass preview (E5). The bank account is a separate step (E1-9). Profile is required before creating a QR and editable later.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | E1-2, E1-3, E1-5, E1-6 | tokens, i18n, account, session |
| Blocks | E2-2, E5-2, E5-3 | QR creation needs a complete profile |

## DB schema

Uses `businesses(name, logoUrl, color)` from E1-4. No new columns.

Logo storage: the MVP stores the file on local disk under `uploads/` and keeps the relative path in `logoUrl` (propuesto, revisar). `uploads/` MUST be git-ignored.

## Acceptance criteria

- **AC1** After sign up, a user without a business name MUST be sent to the onboarding form before anything else in `/app`.
- **AC2** `name` MUST be required, trimmed, 1 to 80 characters. (length propuesto, revisar)
- **AC3** `color` MUST be a hex color chosen from the picker; the default MUST be the BRAND.md primary color.
- **AC4** `logo` MUST be optional. Accepted types PNG, JPEG, WebP (and SVG only if sanitized, otherwise rejected); max 1 MB. (propuesto, revisar)
- **AC5** Creating a QR MUST be blocked until the business has a name (E2-2 checks this).
- **AC6** The owner MUST be able to edit name, logo and color later from settings, and remove the logo.
- **AC7** The profile endpoints MUST only read and write the business of the logged-in user.
- **AC8** The form MUST show a live preview of how the name, color and logo look. (propuesto, revisar)
- **AC9** The chosen color MUST keep text readable; if contrast against white or dark text fails WCAG AA, the UI MUST pick the readable text color automatically. (propuesto, revisar)

## Business rules

```gherkin
Feature: Business profile

  Scenario: BR1 Onboarding is required
    Given I just signed up
    When I open "/app"
    Then I am shown the business profile form

  Scenario: BR2 Name is required
    When I submit the form with an empty name
    Then I see a required-field error
    And my profile is not saved

  Scenario: BR3 Logo is optional
    When I submit a valid name without a logo
    Then my profile is saved
    And I can continue to the next step

  Scenario: BR4 Oversized or wrong-type logo rejected
    When I upload a 3 MB file or a PDF as logo
    Then I see a file error
    And my previous logo is unchanged
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1, BR1 | e2e / component | "Onboarding is required" |
| AC2, BR2 | integration | "Name is required" |
| AC3, AC6, BR3 | integration | "Logo is optional" and edit flow |
| AC4, BR4 | integration | "Oversized or wrong-type logo rejected" |
| AC7 | integration | user A cannot read or update user B's profile (feeds E1-8) |
| AC9 | unit | readable-text-color helper meets AA on sample colors |

## Technical notes

- `GET /business` and `PUT /business` (no id in the path; the business comes from the session).
- Logo upload with `@fastify/multipart` (new dependency; ask first). Validate by magic bytes, not just by extension. Serve logos with a safe `Content-Type`, and `X-Content-Type-Options: nosniff`.
- Shared zod schema `BusinessProfileInput` in `packages/shared`.

## Security & data usage

- Business name and logo are shown to customers on the wallet pass and screens; the owner chooses what to publish. No personal data beyond what the owner enters.
- Uploaded files are untrusted: validate type and size, randomize file names, never serve from a path built from user input.

## Out of scope

- Bank account registration (E1-9).
- Cropping or editing the logo, multiple logos, multiple businesses.
- CDN or cloud storage for logos.

## Estimate

2 pts: one form, two endpoints, upload validation. Grows if SVG support is wanted.
