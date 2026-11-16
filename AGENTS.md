# AGENTS.md

Instructions for AI coding agents working in this repo. Read `README.md`, `_docs/PRD.md` (scope) and `_docs/BRAND.md` (colors, type, accessibility) before building anything.

## Project

BuzzQR (temporary name; repo codename Pey QR Wallet): a web app for Mexican businesses to create CoDi payment QRs via the [Pey API](https://docs.pey.mx/), get notified when paid, and keep a payment history. Hackathon MVP, runs locally. Apple/Google Wallet are **mocked**.

## Stack and layout (planned)

Node + TypeScript, Fastify API, SQLite (Drizzle), React + Vite, npm workspaces.

```
apps/api        # Fastify API, Pey client, webhooks, SSE, WalletProvider
apps/web        # React dashboard
packages/shared # shared types (Qr, Payment, API contracts)
_docs           # PRD, brand book, product docs
```

Keep to this layout. Put shared types in `packages/shared`, not duplicated in each app.

## Commands

Run from the repo root (Node >= 22, npm workspaces `@buzzqr/api`, `@buzzqr/web`, `@buzzqr/shared`):

- `npm run dev`: API and web together (API loads `../../.env` via `tsx --env-file-if-exists`)
- `npm run lint` / `npm run format:check` / `npm run typecheck`
- `npm test`: Vitest, whole repo. One file: `npx vitest run path/to/file.test.ts`; one test: `npx vitest run -t "name"`

## Scope rules

- Stay within the PRD MVP. Non-goals: real wallet passes, roles/teams, password reset, payment links, CoDi push notifications, CFDI, deployment.
- Two QR types only: **generic** (`amount: 0`, no concept, no expiration) and **custom** (amount > 0, concept required, optional expiration of at least 360 s).
- Wallets go behind `WalletProvider`; implement only `MockWalletProvider`. Do not add Apple/Google certificates or APIs.
- Basic email + password auth (httpOnly cookie sessions). Each user has one isolated workspace: scope **every** query by the session user, never by client-supplied ids, and return 404 for other users' resources. See FR-1/FR-1b in the PRD.

## UI, brand and accessibility

- Follow `_docs/BRAND.md`. Define its colors, type scale and spacing as CSS variables (design tokens) with light and dark themes; no hard-coded hex values in components.
- Fonts: Inter (UI/body) and Plus Jakarta Sans (large headings only). Body text at least 16 px, in `rem`; money uses tabular figures.
- Target **WCAG 2.2 AA**: contrast per the brand book, visible focus rings, 44 px touch targets, keyboard support, labels on all inputs, `prefers-reduced-motion` respected.
- Never use color alone for state (success, error, warning): add an icon and text. Green (Emerald) is only for "payment received", and is never a text color on white.
- Payment notifications use an ARIA live region (`role="status"`). QR codes are always dark on white, also in dark mode.
- Mobile first; check desktop and 320 px wide at 200% zoom.
- Landing page (`/`, FR-0): bilingual (es-MX default, en) via i18n files; no invented testimonials, user counts or badges; CoDi and Pey logos allowed.

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
- Branches, commits and PRs follow [`_docs/Project/GIT_WORKFLOW.md`](_docs/Project/GIT_WORKFLOW.md): trunk-based, `<type>/<issue>-<story-id>-<slug>` branch names, Conventional Commits, one story per PR, squash merge, never work on `main`.
- After you create a PR, end your answer with the "NEXT STEP: ADVERSARIAL REVIEW" box from `_docs/Project/GIT_WORKFLOW.md` (section 5), filled in with the PR number and story ID. Do not run the review in the same session.
- Story specs live in `_docs/Project/stories/`; implement only `Approved` stories and change the spec in the same PR as any behavior change.
- Product name lives in one config constant (currently `BuzzQR`); never hard-code it in copy or translations.
- All user-facing text goes through i18n (Spanish and English); no hard-coded strings in components.
- After pushing fixes for review findings, post a comment on the PR and on the story's issue with a table of `#`, finding and fix, plus what was deliberately not changed and the checks run. Draft it and get the user's OK before posting.
