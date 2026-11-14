# BuzzQR Backlog: Epics, Stories and Sprint Plan

Board: GitHub Project **"Pey QR Wallet"**. 4 sprints of 1 week. Source of scope: [PRD](PRD.md). Look and feel: [BRAND.md](BRAND.md).

**Estimates** are story points (1 = a few hours, 2 = about a day, 3 = 2 days, 5 = 3+ days). Anything above 5 must be split. Planning capacity is about 3 people × 4 weeks; the sprint totals below leave room for bugs and review.

**Definition of Done (all stories):** acceptance criteria met; works on mobile and desktop and in both themes where UI; texts in Spanish and English (i18n); accessible (keyboard, labels, contrast per BRAND.md); tests for the logic that matters; reviewed and merged to `main`; no secrets in the repo.

## Sprint goals

| Sprint | Goal | Demo at the end |
|---|---|---|
| **S1** | Foundations: users can sign up, log in, and create a generic QR | Sign up, set up business, see a generic QR on screen |
| **S2** | Money in: custom QR, webhook, payment saved, live notification | Pay $0.01 (or simulate) and see "Pago recibido" in real time |
| **S3** | Records and wallet: history and totals, wallet mock, landing page | Full owner flow plus a landing page that explains the app |
| **S4** | Harden and ship the demo: accessibility, reconciliation, real-payment test, polish | End-to-end demo script on real data, release candidate |

## Epics

| ID | Epic | Sprints |
|---|---|---|
| E1 | Foundations, accounts and isolation | S1 |
| E2 | QR creation and display | S1-S2 |
| E3 | Payments and notifications | S2 |
| E4 | Payment history | S3 |
| E5 | Wallet (mock) | S3 |
| E6 | Landing page, brand and i18n | S1, S3-S4 |
| E7 | Quality, accessibility and demo | S2-S4 |

---

## E1 Foundations, accounts and isolation

| ID | Story | Pts | Sprint |
|---|---|---|---|
| E1-1 | **Project scaffold:** as a developer, I have the monorepo (`apps/api`, `apps/web`, `packages/shared`), lint, format, scripts and `.env.example`, so everyone starts from the same base. *AC: `npm run dev` starts API and web; strict TypeScript; README run steps.* | 3 | S1 |
| E1-2 | **Design tokens and theming:** as a user, I see the BuzzQR look in light and dark. *AC: BRAND.md colors, type scale and spacing as CSS variables; theme follows system setting with a manual toggle; fonts loaded.* | 3 | S1 |
| E1-3 | **i18n setup (es-MX / en):** as a user, I can use the app in Spanish or English. *AC: all texts from translation files; language toggle remembered; product name from one constant.* | 2 | S1 |
| E1-4 | **Database and migrations:** as a developer, I have SQLite with `users`, `sessions`, `businesses`, `qrs`, `payments`. *AC: migrations run from a clean state; seed script for demo data.* | 3 | S1 |
| E1-5 | **Sign up:** as a new owner, I create an account with email and password. *AC: validation and clear errors; password hashed; account gets its own workspace.* | 3 | S1 |
| E1-6 | **Log in and log out:** as an owner, I log in and out securely. *AC: httpOnly cookie session; login rate limit; protected routes redirect to login.* | 3 | S1 |
| E1-7 | **Business profile onboarding:** as an owner, I set my business name, optional logo and color after sign-up. *AC: required before creating a QR; editable later.* | 2 | S1 |
| E1-9 | **Register bank account:** as an owner, I register the account that receives my payments. *AC: form for alias, holder legal name, person or company, 18-digit CLABE with validation; calls Pey `POST /bank-account`; saves the Pey id on my business; plain-language errors.* **Start first: Pey takes up to 5 business days to activate an account.** | 3 | S1 |
| E1-10 | **Bank account status:** as an owner, I see if my account is Pending or Active and I'm told when it's ready. *AC: status badge; updates from Pey `bank-account.updated` webhook and a manual refresh (`GET /bank-account/{id}`); QR creation blocked with a clear message until Active.* | 3 | S2 |
| E1-8 | **User isolation:** as an owner, I can only ever see my own data. *AC: every query scoped by the session user; other users' resources return 404; automated tests with two users.* | 3 | S2 |

## E2 QR creation and display

| ID | Story | Pts | Sprint |
|---|---|---|---|
| E2-1 | **Pey client:** as a developer, I call Pey `POST /codi/qr` from the API only. *AC: typed client, API key from env, errors mapped to friendly messages, mockable in tests.* | 3 | S1 |
| E2-2 | **Create generic QR:** as an owner, I create a QR with no amount or description in one click. *AC: sends `amount: 0`, our `metadata` and the business's `bankAccountId` (must be Active); saved to my account; shown on screen.* | 3 | S1 |
| E2-3 | **Render and present QR:** as an owner, I show the QR full-screen to a customer. *AC: QR drawn from `qrString`, dark on white with quiet zone, readable in light and dark theme; big and bright in present mode.* | 3 | S1 |
| E2-4 | **Create custom QR:** as an owner, I create a QR with amount and description for a specific sale. *AC: amount greater than 0, concept required, optional expiration of 360 s or more; validation messages; same present mode.* | 3 | S2 |
| E2-5 | **My QRs list:** as an owner, I see my QRs, open one, and deactivate or hide one. *AC: type, amount, concept, status, created date; empty state.* | 2 | S2 |

## E3 Payments and notifications

| ID | Story | Pts | Sprint |
|---|---|---|---|
| E3-1 | **Webhook endpoint:** as the system, I receive Pey payment events safely. *AC: Standard Webhooks signature verified; invalid signature rejected; duplicate `webhook-id` ignored; unknown QR logged and ignored.* | 5 | S2 |
| E3-2 | **Save payments:** as an owner, each paid QR creates a payment record under my account. *AC: amount, concept, `numRef`, date paid, transaction id unique; mapped to the right user via QR.* | 3 | S2 |
| E3-3 | **Live notification stream:** as an owner, I get an alert the moment I'm paid. *AC: SSE stream per logged-in user; reconnects on drop; only my events.* | 3 | S2 |
| E3-4 | **"Pago recibido" alert UI:** as an owner, I see a clear banner with amount and QR, plus optional sound. *AC: BRAND toast, announced to screen readers, stays at least 6 s, not sound-only.* | 3 | S2 |
| E3-5 | **Simulate payment (dev tool):** as a developer, I test notifications without real money. *AC: dev-only button posting a signed fake event; disabled in production.* | 2 | S2 |
| E3-6 | **Local webhook tunnel guide:** as a developer, I can receive real Pey webhooks locally. *AC: documented cloudflared/ngrok steps in README; webhook URL config.* | 1 | S2 |

## E4 Payment history

| ID | Story | Pts | Sprint |
|---|---|---|---|
| E4-1 | **Payments list:** as an owner, I see all payments received. *AC: date, amount, concept, QR used; newest first; pagination; empty state.* | 3 | S3 |
| E4-2 | **Filters and totals:** as an owner, I filter by date range and QR and see the total. *AC: today / 7 days / custom range; total updates with filters.* | 3 | S3 |
| E4-3 | **Dashboard summary:** as an owner, I see today's and total received at a glance. *AC: tiles on the home screen with the latest payments.* | 2 | S3 |
| E4-4 | **CSV export (nice to have):** as an owner, I export my payments. *AC: filtered rows, UTF-8 with correct headers.* | 2 | S4 |
| E4-5 | **Sync with Pey (reconciliation):** as an owner, I recover payments a missed webhook did not deliver. *AC: "Sync" calls Pey transactions endpoint; no duplicates created.* | 3 | S4 |

## E5 Wallet (mock)

| ID | Story | Pts | Sprint |
|---|---|---|---|
| E5-1 | **Wallet provider interface:** as a developer, wallets sit behind one interface with a mock implementation. *AC: `createPass(qr)` contract; mock returns pass data; easy to swap for real later.* | 2 | S3 |
| E5-2 | **Apple Wallet pass preview:** as an owner, I tap "Add to Apple Wallet" and see a realistic pass. *AC: business name, color, QR, "Scan to pay"; clearly marked as preview in this version.* | 3 | S3 |
| E5-3 | **Google Wallet pass preview:** same for Google Wallet. | 3 | S3 |
| E5-4 | **Wallet status:** as an owner, I see which QRs are "in my wallet" (mock). *AC: status saved per QR; shown in the QR list.* | 2 | S3 |

## E6 Landing page, brand and i18n

| ID | Story | Pts | Sprint |
|---|---|---|---|
| E6-1 | **Landing structure and copy:** as a visitor, I understand the app in about 10 seconds. *AC: hero, 3 steps, benefits, trust block, final call to action; Spanish and English copy; only true claims.* | 3 | S3 |
| E6-2 | **Hero animation:** as a visitor, I see an animated phone with a QR pass and a "Pago recibido" alert. *AC: CSS/SVG, respects reduced motion, fast load.* | 3 | S3 |
| E6-3 | **Trust block with CoDi and Pey logos:** as a visitor, I see who powers payments and where my money goes. *AC: logos per brand rules; plain-language money flow.* | 2 | S3 |
| E6-4 | **Landing performance and accessibility:** *AC: Lighthouse performance and accessibility at least 90 on mobile; keyboard and 200% zoom pass.* | 2 | S4 |
| E6-5 | **Navigation and routing:** `/` landing, `/signup`, `/login`, `/app`. *AC: logged-in users go to the app; links and language toggle in the header.* | 2 | S3 |

## E7 Quality, accessibility and demo

| ID | Story | Pts | Sprint |
|---|---|---|---|
| E7-1 | **Webhook and QR rule tests:** *AC: automated tests for signature, dedupe, QR validation and user isolation run in CI.* | 3 | S2 |
| E7-2 | **Accessibility pass:** *AC: axe/Lighthouse clean of critical issues; keyboard-only, 200% zoom, screen reader smoke test (VoiceOver, TalkBack), grayscale check.* | 3 | S4 |
| E7-3 | **Real payment test:** *AC: one real $0.01 MXN payment end to end, from scan to notification and history.* | 2 | S4 |
| E7-4 | **Demo script and seed data:** *AC: scripted 5-minute demo; demo account with sample data; fallback plan if Pey is unreachable.* | 2 | S4 |
| E7-5 | **Bug bash and polish:** *AC: critical and high bugs fixed; empty, loading and error states reviewed on every screen.* | 3 | S4 |
| E7-6 | **Security review:** *AC: no secrets in repo or browser; auth and webhook checks reviewed; dependency audit.* | 2 | S4 |

---

## Sprint load

| Sprint | Stories | Points |
|---|---|---|
| S1 | E1-1 to E1-7, E1-9, E2-1 to E2-3 | 31 |
| S2 | E1-8, E1-10, E2-4, E2-5, E3-1 to E3-6, E7-1 | 31 |
| S3 | E4-1 to E4-3, E5-1 to E5-4, E6-1 to E6-3, E6-5 | 28 |
| S4 | E4-4, E4-5, E6-4, E7-2 to E7-6 | 19 plus buffer |

S4 is intentionally lighter: it is the buffer for slipped work, bugs and the real-payment test. If S1 or S2 slip, drop E4-4 (CSV) first, then E6-2 (hero animation polish).

## Dependencies and risks to schedule

- **Pey API key:** arrives 2026-11-14. Until then build against a mocked Pey client (E2-1) and switch when it arrives.
- **Decided:** one app-level API key; each business registers its own bank account (E1-9, E2-2).
- **Bank account activation takes up to 5 business days** at Pey/Banxico (status `PENDING` until `ACTIVE`). A QR can only use an `ACTIVE` account. Impact: register the team's and demo accounts as soon as the key arrives (Sprint 1, day 1), or S2's real payments, E7-3 and the demo can be blocked. Real users onboarded later will wait the same time, so the pending state needs good UX (E1-10).
- **Open fallback for the demo:** when `bankAccountId` is omitted, Pey sends the money to the account linked to the API key. That is fine for our own demo account but must not be used for real users, so it should be a dev/demo-only flag. Needs your OK.
- **Public webhook URL** is needed for E3-1 (tunnel, E3-6).
- **Apple and Google Wallet real accounts** are not needed for the MVP; the wallet is mocked.
- **Final product name and logo** can change; keep the name in one constant (E1-3).

## Suggested labels and milestones (GitHub)

- Milestones: `Sprint 1`, `Sprint 2`, `Sprint 3`, `Sprint 4`.
- Labels: `epic`, `story`, `E1` to `E7`, `frontend`, `backend`, `bug`, `nice-to-have`.
- Board columns: Backlog, Sprint, In progress, In review, Done.
