---
name: propose
description: Open a question that needs deciding, before anyone has decided it
triggers:
  - propose verb
  - we need to decide
  - open question
  - raise a question
---

# Propose

When triggered, file the **question** — not the answer. A proposed record captures what is undecided, what the options are, and what the trade-offs look like, while the decision is still live.

The front half of the lifecycle: `propose` opens it, `decide` closes it.

```
                                                  ┌──►  status: accepted
propose  ──►  status: proposed  ──►  decide  ──►  │
                                                  └──►  status: rejected

either one may later gain a superseded-by pointer; the status does not change
```

## Why this exists

Without it, a decision only enters the vault after it is made, reconstructed from memory by whoever remembers to say `decide`. The reasoning while options were live — the part worth reading in six months — is gone by then.

## Steps

1. **Collect the question.** Extract what you can from the user's message; ask only for what is missing:
   - What has to be decided?
   - What's forcing it? (a deadline, a blocker, a migration)
   - What options are on the table, and what's the case for each?
   - Who needs to weigh in? (initials — becomes `consulted`)

   Options can be incomplete. A proposal with one option and an open "what else?" is still worth filing.

2. **Check for an existing proposal.** Search `records/` for an open proposal covering the same question. If one exists, add to it rather than opening a second — a question asked twice fragments the discussion.

3. **Write the record.** `records/{date}-{slug}.md` from `records/_template.md` — get the date by running `date +%F`, never by inferring it (see Dates in `PROTOCOL.md`) — with:

   ```yaml
   status: proposed
   decided-by: []        # empty — nobody has decided yet
   consulted: [initials] # who should weigh in
   ```

   Fill `## Context` and `## Options considered`. **Leave `## Decision` and `## Consequences` empty** — writing them is what `decide` does. The marker that a record is open is `status: proposed` in frontmatter, not the empty section; check the field, never the prose.

4. **Commit and push.** `records: propose {slug}`.

## While it is open

A proposed record is **mutable** — that is the point. Options get added, trade-offs sharpen, someone's objection lands. Edit it in place as the discussion moves.

This is the one exception to record immutability, and it is bounded: the moment `decide` accepts the record, it freezes and the normal rule applies (see Record immutability in `PROTOCOL.md`).

## Closing it

- **Answered yes** — run `decide`. It writes the Decision and Consequences, sets `decided-by`, and flips `status` to `accepted`.
- **Answered no** — run `decide`. Same file, same fields, `status: rejected`. The record stays visible; that is the point of it.
- **Dropped** — the question stopped mattering, or answered itself, and nobody ever answered it. Run `archive`. Do not delete it: a question the team chose not to answer is knowledge, and someone will raise it again.

The difference between the last two matters. `rejected` means *we said no*. Archived-and-still-`proposed` means *we never said anything and stopped caring*. Do not use `archive` to record a decision.

## Notes

- Open proposals are surfaced by `hello` and `status`, and `lint` flags any proposal older than `stale-days` as an unanswered question. A proposal nobody sees is a todo list rotting in a folder.
- `propose` is for questions with real alternatives. Not a task tracker — "migrate the prototype by Friday" is a consequence of a decision, not a decision.
- If the decision is already made, skip this and go straight to `decide`. Filing a proposal you resolve in the same breath is ceremony.
