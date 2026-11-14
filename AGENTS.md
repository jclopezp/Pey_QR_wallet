# AGENTS.md

Instructions for AI coding agents working in this repo. Read `README.md` and `_docs/PRD.md` first; the PRD is the source of truth for scope.

## Project

Pey QR Wallet: a web app for Mexican businesses to create CoDi payment QRs via the [Pey API](https://docs.pey.mx/), get notified when paid, and keep a payment history. Hackatons MVP, runs locally. Apple/Google Wallet are **mocked**.

## Stack and layout (planned)

Node + TypeScript, Fastify API, SQLite (Drizzle), React + Vite, npm workspaces.

```
apps/api        # Fastify API, Pey client, webhooks, SSE, WalletProvider
apps/web        # React dashboard
packages/shared # shared types (Qr, Payment, API contracts)
_docs           # PRD and product docs
```

Keep to this layout. Put shared types in `packages/shared`, not duplicated in each app.

## Scope rules

- Stay within the PRD MVP. Non-goals: real wallet passes, multi-tenant/auth, payment links, CoDi push notifications, CFDI, deployment.
- Two QR types only: **generic** (`amount: 0`, no concept, no expiration) and **custom** (amount > 0, concept required, optional expiration of at least 360 s).
- Wallets go behind `WalletProvider`; implement only `MockWalletProvider`. Do not add Apple/Google certificates or APIs.
- Keep `businessId` in the schema, but assume a single business.

## Pey API

- Spec: `https://docs.pey.mx/openapi.json`. Base URL `https://api.pey.mx`, Bearer auth.
- Create QR: `POST /codi/qr`. Render the QR client-side from `qrString`; do not use `generateImage`.
- Always send `metadata` `{ qrId, businessId }` so webhooks map back to our records.
- Webhook `codi.qr.payment_received`: verify the Standard Webhooks signature, dedupe on `webhook-id` and `transactionId`, persist, then emit an SSE event.
- There is no Pey test environment. Never make real payment calls in tests; use a mocked Pey client and the dev-only "simulate payment" tool.

## Security

- The Pey API key and webhook secret live in `.env` (see `.env.example`). Never commit them, log them, or send them to the browser.
- Call Pey only from `apps/api`.
- Reject webhooks with invalid signatures.

## Working conventions

- TypeScript `strict` mode. No `any` without a comment explaining why.
- Validate external input (API requests, webhook bodies) with a schema (e.g. zod).
- Amounts are MXN; handle them carefully and avoid float math for totals (store integer cents or use a decimal helper).
- Keep changes small and focused; follow milestones M1 to M5 in the PRD.
- Add tests for webhook handling (signature, dedupe) and QR creation rules.
- Ask before adding new dependencies or changing the stack.
- Do not commit or push unless the user asks. Git remote is SSH (`jclopezp/Pey_QR_wallet`).
