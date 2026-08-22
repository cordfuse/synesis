---
version: 0.1
stale-days: 90
---

# Protocol

This is a Synesis vault — a file-based shared knowledge protocol for software teams. Every AI coding agent that can read markdown can use this.

## How it works

This repo is your team's institutional memory. Decisions, conventions, people profiles, and skills live here as markdown files. Any AI agent (Claude Code, Codex, Copilot, or others) reads these files to understand how your team works.

## Directory structure

| Path | What lives here |
|---|---|
| `records/` | Decisions, ADRs, anything the team agreed on |
| `people/` | One profile per team member — role, expertise, ownership |
| `conventions/` | How we do things here — branching strategy, commit format, coding standards |
| `skills/` | Agent capabilities — what the agent can do and when to activate |
| `attachments/` | Binary files linked to records (subfolder per record) |
| `tools/` | Team-shared scripts (PowerShell, bash, Node, etc.) |

## Naming convention

UPPERCASE filenames (`PROTOCOL.md`, `AGENTS.md`, `VERBS.md`) are protocol infrastructure. Lowercase filenames (`onboard.md`, `sarah.md`, `git.md`) are team content.

## Linking

Use `[[wikilinks]]` for all internal cross-references: `[[people/sarah]]`, `[[conventions/git]]`, `[[records/2026-08-20-api-redesign]]`. The lint skill validates that links resolve to real files.

## Frontmatter

Every content file has YAML frontmatter. See `_template.md` files in each directory for the expected fields.

### Records
```yaml
title: ...
date: YYYY-MM-DD
decided-by: [initials]
consulted: [initials]
last-verified: YYYY-MM-DD
status: active | superseded
superseded-by: filename (when superseded)
tags: [...]
```

### People
```yaml
name: ...
initials: ...
aliases: [...]
email: ...
role: ...
joined: YYYY-MM-DD
tags: [...]
```

### Conventions
```yaml
name: ...
last-verified: YYYY-MM-DD
tags: [...]
```

### Skills
```yaml
name: ...
description: ...
triggers:
  - ...
```

## Verbs

See `VERBS.md` for the full list. Key verbs: `hello` (briefing), `status` (what's in flight), `onboard` (new member setup), `decide` (file a decision), `handoff` (transfer work), `lint` (check hygiene), `search` (find knowledge).

## Versioning

This protocol is at **v0.1**. Minor bumps add conventions or verbs. Major bumps change directory structure or this file's format.

## Freshness

Records and conventions carry a `last-verified` date. The `lint` skill flags anything older than the `stale-days` threshold in this file's frontmatter (default: 90 days).

## Scope boundary

Conventions in this vault apply to **this vault only**. In a multi-root workspace, project repos have their own rules. Never apply vault conventions (branching, commit style, merge strategy) to a project repo unless that project's own instructions say to.

## Tag-based scoping

Convention `tags` can scope content by audience:

- **Machine tags** (e.g. `[cachy]`, `[mac]`) — conventions specific to one host. Agents on other machines skip these.
- **Agent tags** (e.g. `[claude-code]`, `[codex]`) — agent-type-specific tuning. Each agent reads its own tag and ignores others.
- **Topic tags** (e.g. `[git]`, `[ci]`, `[infrastructure]`) — for search and filtering.

Tags are conventions, not enforcement — agents use them as guidance for what to read.

## Contributing

No PR gate on this vault. Commit directly. Trust the team. Git blame + git log = full audit trail. The `lint` skill handles hygiene.
