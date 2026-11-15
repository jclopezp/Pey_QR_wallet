# Git workflow

Applies to everyone on the repo (humans and AI agents). Repo: `jclopezp/Pey_QR_wallet` (public, SSH remote). Team: 3 people, 1-week sprints ([BACKLOG](BACKLOG.md)).

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Rules marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## 1. Model

- **Trunk-based.** `main` is the only long-lived branch. There is no `develop`.
- `main` MUST always build, pass tests and be demoable.
- Nobody pushes directly to `main`; every change enters through a pull request (PR).
- One story = one branch = one PR. A story spec in [`stories/`](stories/) is the unit of work.

## 2. Branch names

```
<type>/<issue>-<story-id>-<slug>
```

| Part | Rule |
|---|---|
| `type` | `feat`, `fix`, `docs`, `spec`, `test`, `refactor`, `chore` |
| `issue` | GitHub issue number |
| `story-id` | backlog ID in lowercase (`e1-5`); omit for work with no story (`chore/12-update-deps`) |
| `slug` | 2 to 5 lowercase words, hyphen separated, no accents |

Examples:
- `feat/5-e1-5-sign-up`
- `feat/8-e1-9-register-bank-account`
- `fix/21-webhook-duplicate-transaction`
- `spec/14-e3-1-clarify-replay-window`
- `docs/30-tunnel-guide`

Rules:
- Names MUST be lowercase, MUST NOT contain spaces, and SHOULD be 50 characters or fewer.
- Create the branch from the issue so it is linked: `gh issue develop <issue> --name <branch> --checkout`.
- Branches MUST start from an up-to-date `main`.
- A branch SHOULD live 2 days or less; if a story takes longer, split it or rebase on `main` daily. (propuesto, revisar)
- Delete the branch after merge (automatic, see section 6).

## 3. Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <imperative summary, 72 chars max>

<optional body: why, not what>

Refs #<issue>
```

- `type`: same list as branches, plus `ci` and `build`.
- `scope`: `api`, `web`, `shared`, `db`, `docs`, `ci`.
- Mention the story ID in the summary when useful: `feat(api): add sign up endpoint (E1-5)`.
- Commits SHOULD be small and each SHOULD leave the build green.
- Commits MUST NOT contain secrets, `.env`, API keys, webhook secrets, database files or `uploads/`.
- History on feature branches MAY be rewritten (rebase, `--force-with-lease`) **only** on your own branch before review starts. (propuesto, revisar)
- Force-pushing `main` is FORBIDDEN.

## 4. Pull requests

- **Title:** `E1-5 Sign up` (story ID and name, same as the issue). Non-story work: `chore: update dependencies`.
- **Body:** MUST contain these sections, in this order:
  1. **Description:** 1 to 3 sentences saying what the PR is, in plain language. A reviewer who has not read the issue MUST be able to understand it.
  2. **What changed:** a short list of the concrete changes (endpoints, tables, components, files or modules touched, migrations, new dependencies). It MUST describe the change as it is in the diff, not the plan.
  3. **Why:** the reason for the change: the story and acceptance criteria it satisfies, the problem it solves, and any decision or trade-off a reviewer should know about (for example a "(propuesto, revisar)" item you resolved, or something deliberately left out).
  4. `Closes #<issue>`, so merging closes the issue and moves the board item.
- A PR with any of these sections missing or empty MUST NOT be merged. Reviewers SHOULD send it back instead of reviewing the code.
- The squash commit message MUST reuse the Description (as the body) so the history on `main` explains itself.
- **Draft early.** Open a draft PR after the first push; mark ready when the checklist is complete.
- **Size:** a PR SHOULD stay under about 400 changed lines, excluding lockfiles and generated migrations. (propuesto, revisar)
- **One story per PR.** Unrelated fixes go in their own PR.

PR body template (also the content of `.github/pull_request_template.md`):

```markdown
## Description
<1-3 sentences: what this PR is>

## What changed
- <endpoint / table / component / module / migration / dependency>

## Why
<story and AC it satisfies, problem solved, decisions and trade-offs>

Closes #<issue>

## Checklist
(see below)
```

PR checklist (goes under `## Checklist` in the PR body):

- [ ] Acceptance criteria covered by tests; AC IDs listed in test names or the PR
- [ ] Business rules (Gherkin) have a matching test
- [ ] Spec updated **in this PR** if behavior differs from the story
- [ ] Definition of Done from [BACKLOG](BACKLOG.md) met (mobile and desktop, both themes, es/en, accessibility)
- [ ] No secrets, no `.env`, no real Pey calls in tests
- [ ] `npm run typecheck`, `npm run lint` and `npm test` pass locally
- [ ] New dependencies were approved by the owner beforehand

## 5. Review and merge

- Every PR MUST have at least 1 approval from someone other than the author.
- CI MUST be green before merge. Until CI exists (E7-1), the author runs typecheck, lint and tests and states the result in the PR.
- Review turnaround SHOULD be within one working day. (propuesto, revisar)
- Review comments MUST be resolved before merge.
- Security-sensitive stories (auth E1-5/E1-6, webhook E3-1, isolation E1-8, bank account E1-9) SHOULD be reviewed by a second person with the spec open. (propuesto, revisar)
- **Merge method: squash merge.** The squash title is the PR title. History on `main` stays linear: one commit per story.
- The author merges after approval and green CI.

### Independent adversarial review

Every PR gets an automated adversarial review from [`.claude/agents/adversarial-reviewer.md`](../../.claude/agents/adversarial-reviewer.md), run in a **new session** so it has no context from the development work.

- **When:** right after the PR is created (draft is fine), and again after pushing fixes for its findings.
- **Who suggests it:** the session (human or AI agent) that creates the PR MUST end its message with the box below, filled in with the real PR number and story ID. It MUST NOT run the review itself in that session.
- **What the reviewer does:** checks the PR against the story, `AGENTS.md` and this document. It posts one comment-only review on the PR (inline where it can) and a short summary on the story's issue. It never approves, merges or moves the board card.
- **What the author does:** resolves the review threads on the PR. The human approval above is still required.

```text
+----------------------------------------------------------------+
|  NEXT STEP: ADVERSARIAL REVIEW                                 |
|                                                                |
|  1. Open a NEW chat session (not this one).                    |
|  2. Paste this prompt:                                         |
|                                                                |
|     @adversarial-reviewer review PR #<pr> (story <story ID>)   |
|                                                                |
|  Example: @adversarial-reviewer review PR #13 (story E1-1)     |
+----------------------------------------------------------------+
```

For a PR with no story, use `review PR #<pr>` and drop the story.

## 6. Keeping branches current

- Before asking for review, and after `main` moves: `git fetch origin && git rebase origin/main`.
- **Migrations:** two branches that add a Drizzle migration will conflict on numbering. The branch that merges second MUST rebase, delete its generated migration, and regenerate it on top of `main`. Never edit a migration that is already on `main`.
- **`packages/shared`** is the most shared surface; changes to its public types SHOULD be announced in the PR description. (propuesto, revisar)
- Delete merged branches (enable "Automatically delete head branches" in repo settings).

## 7. Spec-driven rules in Git

- A story MUST be `Approved` before its feature branch is opened.
- Spec changes use `spec/` branches or are included in the feature PR. If code and spec disagree, the spec is changed first or in the same PR, never after.
- Resolving a "(propuesto, revisar)" item means editing the story file and the issue body in the same PR.

## 8. Board and issue states

| Event | Board status |
|---|---|
| Story in the sprint | Sprint |
| Branch created | In progress |
| PR marked ready | In review |
| PR merged, issue closed | Done |

Automatic transitions come from the project's built-in workflows (enable "Item closed" -> Done and "Pull request merged" -> Done). The rest are moved by hand. (propuesto, revisar)

## 9. Releases

- `main` is the release line. At the end of each sprint tag the demo-ready commit: `v0.<sprint>.0` (for example `v0.1.0` after Sprint 1). (propuesto, revisar)
- Hotfixes follow the normal flow: `fix/` branch, PR, squash into `main`, tag a patch version.

## 10. Secrets

- `.env` MUST be git-ignored; `.env.example` holds names only.
- If a secret is committed, treat it as leaked: **rotate it** (Pey API key, webhook secret, session secret) and tell the owner. Rewriting history is not enough because the repo is public.

## 11. AI agents

- An agent MUST NOT commit, push, open a PR or merge unless the user asks (AGENTS.md).
- When asked, an agent works on a branch named per section 2, never on `main`, and never force-pushes.
- Agent-written commits follow section 3 and carry the attribution lines the tool requires.

## 12. Recommended repository settings

Not applied yet; needs the owner's approval (see the PR that introduced this file).

- Branch protection on `main`: require a PR, 1 approval, dismiss stale approvals, require status checks once CI exists, require linear history, block force pushes and deletions.
- Allow squash merge only; disable merge commits and rebase merge.
- Enable "Automatically delete head branches".
- PR template at `.github/pull_request_template.md` with the Description / What changed / Why / Checklist template from section 4, so every new PR starts with those sections.
