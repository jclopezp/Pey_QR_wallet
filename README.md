# BuzzQR

> Temporary name. Repo codename: Pey QR Wallet.

Web app for businesses in Mexico to collect payments with CoDi QR codes, powered by the [Pey API](https://docs.pey.mx/).

## What it does

- **Two QR types**
  - **Generic:** no amount or description; the payer enters the amount.
  - **Custom:** fixed amount and description, for a specific product or service.
- **Wallet access:** save the QR to Apple Wallet and Google Wallet so the owner can show it quickly. *(Mocked in the MVP.)*
- **Payment notifications:** real-time alert when a payment is completed (Pey webhook → Server-Sent Events).
- **Payment records:** history of payments received, with filters and totals.

## Status

Hackathon MVP, runs locally. Wallet integrations are mocked behind a `WalletProvider` interface; real passes come after the MVP.

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
