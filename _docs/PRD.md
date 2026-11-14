# PRD — Pey QR Wallet (MVP)

**Status:** Draft v0.1 · **Date:** 2026-11-14 · **Type:** Hackathon MVP, local-first (TypeScript)

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
- Multi-tenant accounts, roles, billing, refunds.
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

1. As an owner, I create a **generic QR** once and save it to my wallet so I can show it any time.
2. As an owner, I create a **custom QR** with amount and description for a specific sale and show it full-screen.
3. As an owner, I see a **notification** the moment a payment is completed, with amount and which QR was paid.
4. As an owner, I view a **history** of payments with date, amount, concept, QR used, and status; I can filter by date and QR.
5. As an owner, I see **daily/total received** at a glance.
6. As an owner, I tap **Add to Apple Wallet / Google Wallet** and see a realistic pass preview (mock).

## 7. Functional requirements

### FR-1 Business profile
- Single business for MVP: name, logo (optional), brand color. Stored locally. `businessId` kept in the schema for future multi-tenancy.

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

1. **Setup** → set business profile → create generic QR → "Add to wallet" (mock).
2. **Sale (generic)** → open QR from wallet/app → customer scans and enters amount → webhook → notification → record.
3. **Sale (custom)** → create QR with amount + concept → show full-screen → customer pays → notification → record.

## 9. Technical approach

- **Stack:** Node + TypeScript, Fastify API, SQLite (Drizzle), React + Vite web app, npm workspaces with a `packages/shared` types package.
- **Pey integration:** typed client in `integrations/pey`; API key in `.env` (never sent to the browser); Bearer auth against `https://api.pey.mx`.
- **Notifications:** SSE stream `/events`.
- **Structure:** see project layout in the kickoff proposal (`apps/api`, `apps/web`, `packages/shared`, `_docs`).
- **Pey spec:** `https://docs.pey.mx/openapi.json` (version 2026-10-20).

### Data model (draft)
- `businesses(id, name, logoUrl, color)`
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
| Duplicate/replayed webhooks | Double-counted payments | Unique `webhook-id` and `peyTransactionId` |

## 11. Success metrics (MVP demo)

- Create a generic QR and a custom QR in <30 s each.
- A real $0.01 payment appears as a notification in <5 s and in history.
- Zero duplicate records after a replayed webhook.
- Wallet mock preview demoed for both Apple and Google.

## 12. Milestones

1. **M1 — Foundations:** monorepo, Pey client, create + render generic/custom QR.
2. **M2 — Payments:** webhook (signature, dedupe), payments table, simulate-payment tool.
3. **M3 — Notifications + history:** SSE toast, history page with filters and totals.
4. **M4 — Wallet mock:** pass previews for Apple/Google, wallet status.
5. **M5 — Polish + demo:** profile branding, full-screen present mode, demo script.

**Post-MVP:** real Google Wallet (JWT), real Apple Wallet (`.pkpass`), auth + multi-business, deployment, web push, CSV/CFDI exports.

## 13. Open questions

1. Does the team already have a Pey API key and a registered CoDi payment account?
2. Single business or multiple for the demo?
3. Language of the UI: Spanish, English, or both?
4. Should custom QRs be allowed in the wallet mock, or generic only?
5. Is a login required for the demo, or is a single local user fine?
