# E1-1 Project scaffold

| | |
|---|---|
| **Epic** | E1 Foundations, accounts and isolation |
| **Sprint** | S1 |
| **Labels** | `story`, `E1`, `backend`, `frontend` |
| **Status** | Approved |
| **PRD refs** | §9 Technical approach |
| **Estimate** | 3 pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As a developer, I have the monorepo with lint, format, scripts and `.env.example`, so that everyone starts from the same base.

## Context

The repo has docs only. Every other story builds on this layout (`apps/api`, `apps/web`, `packages/shared`). Stack is fixed by AGENTS.md: Node + TypeScript, Fastify, SQLite (Drizzle), React + Vite, npm workspaces.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocks | all other stories | they need the workspace |
| External | none | |

## DB schema

None.

## Acceptance criteria

- **AC1** The repo MUST be an npm workspaces monorepo with `apps/api`, `apps/web` and `packages/shared`.
- **AC2** `npm run dev` from the root MUST start the API and the web app together.
- **AC3** TypeScript MUST run in `strict` mode in every workspace.
- **AC4** `packages/shared` MUST be importable from both apps (types and zod schemas).
- **AC5** Root scripts `lint`, `format`, `typecheck` and `test` MUST exist and pass on a clean checkout.
- **AC6** `.env.example` MUST list every variable the apps read (at least `PEY_API_KEY`, `PEY_WEBHOOK_SECRET`, `PEY_BASE_URL`, `SESSION_SECRET`, `DATABASE_URL`) with no real values.
- **AC7** `.env` MUST be git-ignored and MUST NOT be committed.
- **AC8** The README MUST document install and run steps.
- **AC9** The API SHOULD expose `GET /health` returning 200. (propuesto, revisar)
- **AC10** Linting and formatting tools (ESLint, Prettier) and a test runner (Vitest) are new dependencies. They MUST be approved by the owner before being added (AGENTS.md: ask before adding dependencies). (propuesto, revisar)

## Business rules

```gherkin
Feature: Workspace bootstrap

  Scenario: BR1 One command starts everything
    Given a clean checkout with dependencies installed and a copy of .env.example as .env
    When I run "npm run dev"
    Then the API answers on its configured port
    And the web app answers on its configured port

  Scenario: BR2 Secrets are never tracked
    Given a populated .env file
    When I run "git status"
    Then .env does not appear as a tracked or untracked-to-add file
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC2, AC9, BR1 | smoke | `apps/api`: "GET /health returns 200" |
| AC3, AC5 | CI | `npm run typecheck` and `npm run lint` pass |
| AC4 | unit | `packages/shared`: a shared type/schema is imported by both apps and compiles |
| AC6, AC7, BR2 | script | check that `.env.example` has no values and `.gitignore` lists `.env` |

## Technical notes

- Root `package.json` with `workspaces: ["apps/*", "packages/*"]`; run both apps with `concurrently` or npm `--workspaces` (propuesto, revisar).
- Env loading and validation with a zod schema in `apps/api/src/config.ts`; the app MUST fail fast on a missing required variable.
- Web only reads variables prefixed `VITE_`; none of the Pey variables may be prefixed that way.
- Product name lives in one constant (see E1-3).

## Security & data usage

- `PEY_API_KEY` and `PEY_WEBHOOK_SECRET` are server-only. They MUST NOT be logged or reach the browser bundle.
- No personal data in this story.

## Out of scope

- Database (E1-4), auth, i18n, theming.
- CI pipeline hosting and deployment (non-goal).

## Estimate

3 pts: workspace wiring, tooling and docs. Grows if CI is required now.
