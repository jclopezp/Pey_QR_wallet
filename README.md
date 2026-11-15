# BuzzQR

> Temporary name. Repo codename: Pey QR Wallet.

Web app for businesses in Mexico to collect payments with CoDi QR codes, powered by the [Pey API](https://docs.pey.mx/).

## What it does

- **Two QR types**
  - **Generic:** no amount or description; the payer enters the amount.
  - **Custom:** fixed amount and description, for a specific product or service.
- **Wallet access:** save the QR to Apple Wallet and Google Wallet so the owner can show it quickly. _(Mocked in the MVP.)_
- **Payment notifications:** real-time alert when a payment is completed (Pey webhook → Server-Sent Events).
- **Payment records:** history of payments received, with filters and totals.

## Status

Hackathon MVP, runs locally. Wallet integrations are mocked behind a `WalletProvider` interface; real passes come after the MVP.

## Getting started

Requires Node 22 or later.

```bash
npm install
cp .env.example .env   # fill in PEY_API_KEY, PEY_WEBHOOK_SECRET and SESSION_SECRET
npm run dev            # API on http://localhost:3001, web on http://localhost:5173
```

Check the API with `curl http://localhost:3001/health`. Secrets can stay empty for local development; they are required when `NODE_ENV=production`.

| Script              | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Starts the API and the web app together         |
| `npm run lint`      | ESLint                                          |
| `npm run format`    | Prettier (writes); `format:check` only verifies |
| `npm run typecheck` | `tsc` in strict mode in every workspace         |
| `npm test`          | Vitest                                          |

## Planned stack

Node + TypeScript, Fastify API, SQLite (Drizzle), React + Vite, npm workspaces.

```
apps/api        # Fastify API, Pey client, webhooks, SSE
apps/web        # React dashboard
packages/shared # shared types
_docs           # product docs
```

## Docs

- [Product Requirements (PRD)](_docs/PRD.md)
- [Brand book](_docs/BRAND.md) (colors, typography, accessibility) · [color options](_docs/color-palettes.html) · [brand preview](_docs/brand-preview.html)
- [Pey API reference](https://docs.pey.mx/) · [OpenAPI spec](https://docs.pey.mx/openapi.json)

## Local testing notes

- Pey has no test environment yet. Test in production with small amounts (e.g. $0.01 MXN).
- Webhooks need a public URL, so use a tunnel (cloudflared or ngrok) when running locally.
