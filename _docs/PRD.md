# PRD — BuzzQR (MVP)

> *BuzzQR* is a temporary product name. Repo/project codename: Pey QR Wallet.

**Status:** Draft v0.2 · **Date:** 2026-11-14 · **Type:** Hackathon MVP, local-first (TypeScript)

## 1. Summary

A web app that lets a Mexican business create CoDi payment QR codes through the [Pey API](https://docs.pey.mx/), show them quickly to customers, get notified when a payment arrives, and keep a record of payments received. The QR can be saved to Apple Wallet and Google Wallet so the owner can pull it up in seconds.

**MVP scope note:** Apple Wallet and Google Wallet are **mocked** in the MVP. The UI and flow are real; no signed `.pkpass`, no Google Wallet API calls. Real passes are a post-MVP phase.

## 2. Problem

Small businesses (stalls, shops, freelancers, service providers) want to collect CoDi payments but:
- Generating a QR each time, or hunting for a saved image/screenshot, is slow and awkward at the counter.
- They have no immediate confirmation that the customer actually paid.
- They have no simple record of what was received.

## 3. Goals and non-goals

**Goals**
1. Create two QR types in under 30 seconds: generic and custom.
2. Make the generic QR reachable in ≤2 taps from the phone (wallet mock).
3. Real-time "payment received" notification.
4. Persistent, filterable payment history.
5. Run end to end locally.

**Non-goals (MVP)**
- Real Apple/Google Wallet passes (mocked).
- Roles/teams (staff accounts), billing, refunds, social login, password reset, 2FA.
- Payment links, push-notification (CoDi PN) charges, card payments.
- Accounting/tax (CFDI) features.
- Production deployment, hardening, i18n beyond Spanish/English labels.

## 4. Users

- **Primary: Business owner/cashier.** Uses the app on a phone or laptop at the point of sale. Low technical skill.
- **Secondary: Customer.** Scans the QR with their banking app (CoDi). Never uses our app.

## 5. QR types

| | Generic QR | Custom QR |
|---|---|---|
| Amount | None (`amount: 0`, payer enters it) | Fixed amount |
| Description (`concept`) | None | Required |
| Expiration | None (permanent) | Optional (min 360 s), default none |
| Wallet | Yes (primary use) | Optional "save" in mock; typically shown on screen only |
| Use case | Walk-up sales, tips, variable amounts | A specific product/service/order |

## 6. User stories

0. As a visitor, I land on a **simple, attractive home page** that tells me what the app does, why I can trust it, and how to start.
1. As an owner, I create a **generic QR** once and save it to my wallet so I can show it any time.
2. As an owner, I create a **custom QR** with amount and description for a specific sale and show it full-screen.
3. As an owner, I see a **notification** the moment a payment is completed, with amount and which QR was paid.
4. As an owner, I view a **history** of payments with date, amount, concept, QR used, and status; I can filter by date and QR.
5. As an owner, I see **daily/total received** at a glance.
6. As an owner, I tap **Add to Apple Wallet / Google Wallet** and see a realistic pass preview (mock).
7. As a new user, I **sign up and log in** with email and password, and get my own private workspace.
8. As an owner, I can only see **my own** QRs, payments and notifications; no other user's data is ever visible to me.

## 7. Functional requirements

### FR-0 Landing page (home)

The public home page (`/`). Its single job: explain the product in seconds, build trust, and send the visitor to sign up or log in (`/signup`, `/login`) and then into `/app`.

**Content (top to bottom, one scroll):**
1. **Hero:** one-line value proposition (e.g. "Cobra con QR, directo en tu Wallet"), one-line subtitle, primary CTA ("Empezar gratis"), and an animated phone mockup showing a QR pass in the wallet and a "Pago recibido" notification.
2. **How it works, 3 steps:** Crea tu QR → Guárdalo en tu Wallet → Recibe el aviso de pago.
3. **Benefits, 3–4 short cards:** two QR types (generic / with amount and description), always one tap away in Apple/Google Wallet, instant payment alerts, automatic payment history.
4. **Trust block:** payments run on **CoDi (Banxico)** through the **Pey** API; money goes directly to the business's own account; no card data stored. Show the CoDi and Pey logos (approved for the landing; still follow Pey's [brand assets](https://docs.pey.mx/brand-assets) usage rules).
5. **Final CTA:** repeat the primary button.

**Requirements:**
- Simple and direct: short copy, one primary action, no forms or sign-up walls before the CTA.
- Visually attractive and dynamic: subtle motion (hero phone animation, scroll-in reveals, animated payment toast demo), respecting `prefers-reduced-motion`.
- Builds confidence: only claims that are true for the product. **No fabricated testimonials, user counts, or security badges.** Trust comes from CoDi/Banxico, Pey, and transparent "how your money flows" copy.
- Responsive, mobile-first; fast load (no heavy video; use CSS/SVG/Lottie-light animation).
- Light and dark theme aware; accessible (WCAG 2.2 AA). Colors, typography and accessibility rules come from [`BRAND.md`](BRAND.md) (palette A, Azul Confianza).
- Bilingual: Spanish (default, Mexico) and English, with a visible language toggle that remembers the choice. All copy lives in translation files (i18n), not hard-coded.
- Product name is **BuzzQR** (temporary): keep it in a single config constant so it can be swapped later; no logo or brand colors yet, so use a neutral palette that is easy to re-theme.
- Static content, no backend dependency; lives in `apps/web` at route `/`. The dashboard moves to `/app`.

**Acceptance:** a first-time visitor can say what the app does and click the CTA within ~10 seconds; Lighthouse performance and accessibility ≥ 90 on mobile.

### FR-1 Authentication and accounts (basic)
- Sign up, log in, log out with **email + password**. Passwords hashed (argon2id or bcrypt); never stored or logged in plain text.
- Session via **httpOnly, SameSite cookie** (server-side session or signed JWT); CSRF protection on state-changing requests.
- Basic validation: email format, minimum password length (8+), rate limit on login attempts.
- All `/app` routes and API endpoints (except `/`, `/signup`, `/login`, and the Pey webhook) require an authenticated session.
- Out of MVP: password reset, email verification, social login, 2FA.

### FR-1b Separate instances per user (data isolation)
- Each user account owns exactly one **workspace** (business) and has its own QRs, payments, wallet status and notification stream. Nothing is shared between users.
- **Isolation rule:** every query is scoped by `userId`/`businessId` taken from the session, never from client input. Accessing another user's resource returns 404.
- SSE stream `/events` only delivers events for the logged-in user.
- Webhooks are routed to the right user by looking up `codiQrId` / `metadata.qrId` → `qr` → `business`; unknown QRs are ignored (logged, 200).
- Add tests proving user A cannot read, list or modify user B's QRs or payments.

### FR-1c Business profile
- Per user: business name, logo (optional), brand color; set during onboarding after sign-up.
- Receiving account: see open question 1 (how each business is paid).

### FR-2 QR creation
- Generic: one click, calls Pey `POST /codi/qr` with `amount: 0`.
- Custom: form with `amount` (> 0, MXN), `concept` (required), optional `expiration`.
- Always send `metadata` with `{ qrId, businessId }` so webhooks map back to our records.
- Render the QR client-side from `qrString` (Pey recommends this over `generateImage`).
- List, view, and deactivate/hide QRs. Show full-screen "present to customer" view.

### FR-3 Wallet (MOCK)
- "Add to Apple Wallet" and "Add to Google Wallet" buttons on a QR.
- Show a pass preview styled like each wallet (business name, logo, QR, "Scan to pay").
- Mock "added" state persisted locally (`walletStatus: apple | google | none`).
- Backend exposes the same interface the real implementation will use (`WalletProvider.createPass(qr)`), with a `MockWalletProvider` now.

### FR-4 Payment notification
- Endpoint `POST /webhooks/pey` receives `codi.qr.payment_received`.
- Verify the Standard Webhooks signature; dedupe by `webhook-id`; reject invalid signatures.
- Persist the payment, then push a real-time event to the web app (Server-Sent Events).
- UI shows a toast/banner and plays a sound: "Payment received — $X.XX MXN".
- Local dev uses a tunnel (cloudflared/ngrok) so Pey can reach the webhook.
- Dev-only **"simulate payment"** button posts a signed fake event, since there is no Pey test environment.

### FR-5 Payment records
- Store: `peyTransactionId` (unique), `codiQrId`, `qrId`, `amount`, `concept`, `numRef`, `datePaid`, raw payload.
- History page: table, filter by date range and QR, total for the filter, CSV export (nice-to-have).
- Reconciliation (nice-to-have): a "Sync" action pulls `GET /transaction/codi/qr/{id}` to recover missed webhooks.

## 8. Key flows

1. **Setup** → sign up → set business profile → create generic QR → "Add to wallet" (mock).
2. **Sale (generic)** → open QR from wallet/app → customer scans and enters amount → webhook → notification → record.
3. **Sale (custom)** → create QR with amount + concept → show full-screen → customer pays → notification → record.

## 9. Technical approach

- **Stack:** Node + TypeScript, Fastify API, SQLite (Drizzle), React + Vite web app, npm workspaces with a `packages/shared` types package.
- **Pey integration:** typed client in `integrations/pey`; API key in `.env` (never sent to the browser); Bearer auth against `https://api.pey.mx`.
- **Notifications:** SSE stream `/events`.
- **Structure:** see project layout in the kickoff proposal (`apps/api`, `apps/web`, `packages/shared`, `_docs`).
- **Pey spec:** `https://docs.pey.mx/openapi.json` (version 2026-10-20).

### Data model (draft)
- `users(id, email UNIQUE, passwordHash, createdAt)`
- `sessions(id, userId, expiresAt)` (if server-side sessions)
- `businesses(id, userId UNIQUE, name, logoUrl, color, peyBankAccountId NULL)`
- `qrs(id, businessId, type[generic|custom], amount, concept, peyQrId, qrString, expiresAt, walletStatus, active, createdAt)`
- `payments(id, qrId, peyTransactionId UNIQUE, webhookId UNIQUE, amount, concept, numRef, datePaid, raw, createdAt)`

## 10. Constraints and risks

| Risk | Impact | Mitigation |
|---|---|---|
| No Pey test environment (docs: test in production with $0.01 MXN) | Real money, real banks | Use $0.01 payments; add "simulate payment" dev tool |
| Webhooks need a public URL locally | Can't receive events | Tunnel (cloudflared/ngrok); reconciliation sync as backup |
| Pey API key / registered payment account required | Blocks real QR creation | Confirm key early; fall back to a mock Pey client if needed |
| Wallet passes are static; custom QRs are one-off/expire | Wallet misleading for custom QR | Wallet is primarily for the generic QR |
| Real wallets need Apple Developer ($99/yr) + Pass Type ID certs, and a Google Wallet Issuer account | Post-MVP lead time | Mock behind `WalletProvider`; start account setup in parallel |
| Cross-user data leak (multi-tenant) | Privacy breach, loss of trust | Scope every query by session user; isolation tests; 404 on foreign resources |
| Weak auth (passwords, sessions) | Account takeover | Hashing, httpOnly cookies, rate limiting, CSRF protection |
| Duplicate/replayed webhooks | Double-counted payments | Unique `webhook-id` and `peyTransactionId` |

## 11. Success metrics (MVP demo)

- Create a generic QR and a custom QR in <30 s each.
- A real $0.01 payment appears as a notification in <5 s and in history.
- Zero duplicate records after a replayed webhook.
- Wallet mock preview demoed for both Apple and Google.

## 12. Milestones

1. **M1 — Foundations:** monorepo, Pey client, **auth (sign up/login/sessions) and per-user data scoping**, create + render generic/custom QR.
2. **M2 — Payments:** webhook (signature, dedupe), payments table, simulate-payment tool.
3. **M3 — Notifications + history:** SSE toast, history page with filters and totals.
4. **M4 — Wallet mock:** pass previews for Apple/Google, wallet status.
5. **M5 — Landing + polish + demo:** landing page (FR-0), profile branding, full-screen present mode, demo script.

**Post-MVP:** real Google Wallet (JWT), real Apple Wallet (`.pkpass`), password reset/email verification, staff roles, deployment, web push, CSV/CFDI exports.

## 13. Open questions

1. Does the team already have a Pey API key and a registered CoDi payment account? **And how does each user get paid?** Recommended: one app-level Pey API key, and each business registers its own bank account via Pey `POST /bank-account` (stored as `peyBankAccountId`, sent as `bankAccountId` on QR creation), so payments go straight to each business. Alternative: each user pastes their own Pey API key (more setup, separate webhooks per key).
2. ~~Single or multiple businesses~~ **Decided:** multiple users, each with an isolated workspace.
3. ~~UI language~~ **Decided:** Spanish and English.
4. Should custom QRs be allowed in the wallet mock, or generic only?
5. ~~Login required~~ **Decided:** basic email + password auth.
6. Final product name (BuzzQR is temporary), logo and brand colors. The landing uses BuzzQR with a neutral palette until decided.
