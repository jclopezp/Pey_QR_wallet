# <ID> <Story title>

| | |
|---|---|
| **Epic** | E? <name> |
| **Sprint** | S? |
| **Labels** | `story`, `E?`, `frontend` / `backend` |
| **Status** | Draft |
| **PRD refs** | FR-? |
| **Estimate** | N pts |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this ticket are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals, as shown here.

Criteria marked "(propuesto, revisar)" have no clear source in the requirements discussed so far and need the owner's confirmation.

## Story

As a <role>, I <want>, so that <value>.

## Context

Why this story exists, what the user is doing, what the PRD says. Link PRD sections.

## Dependencies

| Type | Item | Why |
|---|---|---|
| Blocked by | <ID> | |
| Blocks | <ID> | |
| External | <Pey API / key / account> | |

## DB schema

Tables and columns this story creates or changes (or "None"). Include constraints, indexes and the migration name.

## Acceptance criteria

- **AC1** The system MUST ...
- **AC2** The system SHOULD ... (propuesto, revisar)

## Business rules

```gherkin
Feature: <name>

  Scenario: BR1 <rule>
    Given ...
    When ...
    Then ...
```

## Tests

| Covers | Level | Test |
|---|---|---|
| AC1, BR1 | unit / integration / e2e | `<file>`: "<scenario name>" |

## Technical notes

Endpoints (method, path, request/response), modules, libraries, files to touch.

## Security & data usage

What personal or sensitive data is read, stored, logged or sent, where it goes, who can see it, retention.

## Out of scope

- ...

## Estimate

N pts: why, and what would make it bigger.
