# Story specs

One file per story, named `<ID>-<slug>.md` (e.g. `E1-5-sign-up.md`). Each file is the **spec** for that story and the source for its GitHub issue. The one-line summaries in [../BACKLOG.md](../BACKLOG.md) stay as the index; this folder holds the detail.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Spec-driven development rules

1. **The spec comes first.** No implementation starts on a story whose status is not `Approved`.
2. **Sources of truth, in order:** [PRD](../../PRD.md) > this story spec > code. If the code and the spec disagree, the code is wrong or the spec must be changed first, in the same PR.
3. **Every acceptance criterion has an ID** (`AC1`, `AC2`, ...) and every ID is covered by at least one test in the *Tests* table. A criterion with no test is not done.
4. **Business rules are written as Gherkin scenarios** (`BR1`, ...). Scenarios are the basis of the automated tests; the test name quotes the scenario name.
5. **Tests are written (or at least outlined) before the code**, and the PR shows them passing.
6. **Anything not sourced is flagged.** A criterion that does not trace to the PRD, AGENTS.md or a decision from the owner carries `(propuesto, revisar)` and MUST be confirmed before the story goes to `Approved`.
7. **Scope is closed by *Out of scope*.** Work not in the spec needs a spec change or a new story.
8. **Definition of Done** from [../BACKLOG.md](../BACKLOG.md) applies to every story on top of its own criteria.

## Status workflow

`Draft` -> `Approved` (owner confirmed all `(propuesto, revisar)` items) -> `In progress` -> `Implemented` (all AC tests green, merged).

## Conventions

- Money is MXN, stored as **integer cents** (`amountCents`); no float math (AGENTS.md).
- Every table that holds user data carries `businessId` or is reachable from it; queries are scoped from the session, never from client input (PRD FR-1b).
- Timestamps are UTC ISO-8601 strings in the API and integer epoch milliseconds in SQLite (propuesto, revisar).
- IDs are UUIDv7 or ULID text (propuesto, revisar).
- Shared request/response types and zod schemas live in `packages/shared`.
