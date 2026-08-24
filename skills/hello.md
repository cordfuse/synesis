---
name: hello
description: Deliver a team briefing for the current user
triggers:
  - hello verb
  - start of session (if the harness supports it)
---

# Hello

When triggered, identify the current user and deliver a team briefing.

## Steps

1. **Identify the user.** Read `git config user.name` and `git config user.email`. Check `people/` for a profile where `email` matches.

2. **If no profile exists:** Trigger the `onboard` skill instead. Do not continue with the briefing.

3. **If a profile exists:** Deliver the briefing below.

**Do not touch `last-seen`.** It is owned by `catchup`, which uses it to work out what changed since you last asked. Overwriting it here silently destroys that baseline — `hello` followed by `catchup` would report no changes no matter how much had happened.

## Briefing format

Greet the user by name, then cover these sections in order:

### Team
- How many people are on the team (count of `people/` profiles, excluding `_template.md`)
- List each person: name, role, and expertise tags (from their profile)

### Open questions
- Any records with `status: proposed` — the questions the team has not answered yet
- For each: title, date opened, who is `consulted`, and how long it has been open
- Flag any older than `stale-days` as overdue. An open question nobody revisits is the failure mode this state exists to prevent
- If there are none, say so in one line and move on

### Recent decisions
- List the last 5-10 records by `date` in frontmatter (most recent first)
- Skip records with `archived: true`
- For each: title, date, decided-by, and status
- If any are `superseded`, note the replacement

### Active conventions
- List all files in `conventions/` (excluding `_template.md` and files with `archived: true`)
- For each: name and a one-line summary of what it covers
- Flag any with `last-verified` older than `stale-days` (from PROTOCOL.md frontmatter)

### Vault status
- Protocol version (from PROTOCOL.md frontmatter)
- Upstream tracking (if `upstream` field exists in PROTOCOL.md frontmatter)
- Whether this machine is wired up — check the global instruction file of each
  installed harness for this vault's absolute path. If none carry it, say so in one
  line and name `wire`: the vault is invisible to sessions started outside this
  folder, and that reads as "Synesis does not do much" when the truth is it was
  never switched on. Do not configure anything — `wire` prints, the developer applies.
- Any active handoff records (records tagged `handoff` with no superseding record)
- Count of tools in `tools/` (if any beyond README.md)

### Available verbs
- List all verbs by reading `skills/*.md` frontmatter (`name` + `description`)

## Notes

- Keep the briefing scannable. Use short lines, not paragraphs.
- Source everything from actual vault files. Never invent context.
- If the vault is sparse (few records, few people), say so -- don't pad.
