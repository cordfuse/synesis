---
version: 1.2
upstream: cordfuse/synesis@v1.2
stale-days: 90
---

# Protocol

This is a shared knowledge vault for a software team — decisions, conventions, people and institutional memory as plain markdown in a git repo. Every AI coding agent that can read a file can use it.

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

UPPERCASE filenames (`PROTOCOL.md`, `AGENTS.md`) are protocol infrastructure. Lowercase filenames (`onboard.md`, `sarah.md`, `git.md`) are team content.

## Linking

Use `[[wikilinks]]` for all internal cross-references: `[[people/sarah]]`, `[[conventions/git]]`, `[[records/2026-08-20-api-redesign]]`. The lint skill validates that links resolve to real files.

## Frontmatter

Every content file has YAML frontmatter. See `_template.md` files in each directory for the expected fields.

### Records
```yaml
title: ...
type: decision | note        # optional; decision if absent
date: YYYY-MM-DD
decided-by: [initials]       # decisions only; required once accepted or rejected
consulted: [initials]
last-verified: YYYY-MM-DD
status: proposed | accepted | rejected   # decisions only; omit entirely on a note
superseded-by: filename (when a later record replaces this one)
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
last-seen: YYYY-MM-DD   # last time this person ran catchup; only catchup writes it
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

## Identity detection

On first interaction, read `git config user.name` and `git config user.email` to identify the current user. Match against profiles in `people/`. If no match exists, run the onboard skill.

## Verbs

Verbs are commands a developer gives to the agent. Each verb maps to a skill file in `skills/`. The agent reads `skills/*.md` frontmatter (`name` + `description`) to discover available verbs.

### Precedence over parent instructions

**A vault's verbs override any parent instruction file's definition of the same name.** When this vault sits inside a larger workspace whose root `CLAUDE.md` / `AGENTS.md` defines its own session verbs — `hello`, `sync`, `status`, `goodbye` — the vault protocol wins inside this directory and everything below it. A vault is self-contained; when you are in it, it is authoritative.

Reserved by this protocol: every name in `skills/*.md` frontmatter. A parent defining a name the vault does not reserve passes through untouched.

Precedence is not composition. Do not run both the parent's version and the vault's — run the vault's only. Two briefings in one turn is the failure this rule exists to prevent.

## Versioning

This protocol is at **v1.2**. Minor bumps add conventions or verbs. Major bumps change directory structure or this file's format.

## Dates

Every `date` and `last-verified` field uses the **machine local date**, not UTC. A record dated today should say what the person filing it would call today.

**Never infer the date.** Run `date +%F` and use what it returns. Guessing produces records that are silently wrong by a day, and `catchup` and `lint` both do arithmetic on these fields. Near midnight the difference between `date` and `date -u` is a whole day.

Across timezones a team will occasionally file two records a day apart that felt simultaneous. That is fine — dates here are for humans, and git holds the exact timestamp.

## Freshness

Records and conventions carry a `last-verified` date. The `lint` skill flags anything older than the `stale-days` threshold in this file's frontmatter (default: 90 days). The `update` skill resolves stale flags by re-verifying content and bumping the date.

## Archiving

Records and conventions can be marked `archived: true` in frontmatter. Archived files are skipped by `hello`, `status`, and `lint` but still discoverable via `search`. Use the `archive` skill to set the flag. Remove it to restore.

**Archiving is not rejection.** An archived proposal is one that stopped mattering before anyone answered it. A `rejected` record is one the team deliberately turned down, and it stays visible — its whole value is stopping the same idea returning in six months. Never archive a proposal to record a no.

## Record types

`records/` holds two kinds of file, distinguished by `type`:

| type | Is | Filed by | `decided-by` | `status` |
|---|---|---|---|---|
| `decision` (default) | what the team **chose** | `propose` → `decide`, or `handoff` | Yes | Yes |
| `note` | what the team **found** — a postmortem, a benchmark, a research finding | `note` | No | **No field at all** |

A record with no `type` is a decision. That keeps every existing record valid and means the common case stays unannotated.

Both are immutable once filed, and both supersede the same way. The difference is that a note has no options, no attribution, no decision to make and therefore no `status` — forcing a finding through the decision template produces a record that lies about how it came to exist.

**A running list that gets edited forever is neither.** An index, a backlog, a catalogue — anything appended to and revised — belongs in `conventions/`, which is living by design. Records are snapshots.

## Record immutability

A decision moves through three states, and `status` records only which one it reached:

| status | Meaning | Mutable? |
|---|---|---|
| `proposed` | an open question — options on the table, nobody has chosen | **Yes** — that is the point |
| `accepted` | answered yes | No |
| `rejected` | answered no | No |

`propose` opens a record and `decide` answers it, either way. Notes carry no `status` at all — nothing was proposed and nothing was accepted.

**Whether a record is still current is a separate question, and `superseded-by` answers it.** A record carrying that field has been replaced by a later one. Its `status` does not change, because what the team decided then is still what it decided. "Superseded" is derived from the pointer and never stored as a state — which is what lets a rejection that is later reversed stay `rejected` and gain a pointer, a pair one field could not express.

A record with `status: accepted` or `status: rejected` is a snapshot — of what was decided, by whom, on a date; or for a `note`, of what was found and how. **Once accepted, its body is not edited.** A decision you can quietly rewrite is not a decision record — it is a draft, and the audit trail (`git blame`, `git log`) becomes worthless.

To correct or change a decision, file a **new** record and set `superseded-by` on the old one. Both stay in the vault. The chain is the history.

**Frontmatter is not body.** These fields are maintained in place, and doing so is not a violation:

- `last-verified` — bumped by the `update` skill
- `status` — set by `decide` when a proposal is answered
- `superseded-by` — set when a later record replaces this one
- `archived` — set by the `archive` skill

**Moved link targets may be repointed.** If a file a record links to is renamed or moved, update the link. Immutability protects the record's *claims*, not its *pointers* — leaving a stale link makes the record wrong, which is the opposite of what the rule is for. The sentence around the link must not change.

**The sole body exception** is the derived `## Related` block at the end of a record, which the `weave` skill owns. It is generated, never hand-written, and regenerable from scratch — delete it and `weave` rebuilds it identically. Nothing above that block is ever touched.

**This applies to answered records only.** A `proposed` record is still being written — edit it freely until `decide` answers it, at which point it freezes, whether the answer was yes or no. Conventions are living documents — how the team works now, not what it decided then. Edit them in place and bump `last-verified`. People profiles are likewise living.

## Record linking (`weave`)

A vault carries two kinds of link, and they are not interchangeable:

- **Authored links** — `[[wikilinks]]` written by hand in body prose, where a sentence genuinely explains a connection. Yours to write, anywhere, at any time. `weave` never touches them.
- **The derived `## Related` block** — a generated index at the end of each record and convention. **Only `weave` writes it.** Never hand-write one, not even when filing a new record; file the record, then run `weave` to generate the block.

`weave` backfills the existing corpus and regenerates every block from scratch, so a hand-written one is overwritten on the next run.

The block is derived content and carries a marker so it is never mistaken for authored prose:

```markdown
## Related

<!-- weave:start -->
- [[conventions/branching]] — branching rules this decision assumes
- [[records/2026-08-20-api-redesign]] — the decision this one revisits
<!-- weave:end -->
```

Links are conservative: a real relationship, not topical adjacency. `weave` covers `records/` and `conventions/`; it skips `people/` profiles, since every record carries `decided-by` and linking people would put the same profile in every block. Archived files are handled in both directions — nothing links to them, and any block they still carry is removed rather than left frozen. See `skills/weave.md` for the rules.

## Working in this vault

**Read files with your file tools, not through a shell.** Reading many files at once is still reading, and every harness has tools for it. Do not shell out to PowerShell, bash or anything else to read, list, grep or parse files here. Shell access in this vault is for `git` and nothing else — `.claude/settings.json` grants `Bash(git:*)` on purpose, and a skill that needs more than git is a skill that has gone wrong.

**Run git plainly from the working directory** — `git config user.name`, `git log`, `git status`. Avoid the `git -C <path>` form: per-repo command approvals are matched on the command as written, so the `-C` form can be refused on machines where the plain form is allowed.

**If something outside this repository cannot be read, say so and carry on.** A wiring check that hits a refused path is not a reason to retry it through a shell. Report what could not be confirmed and finish the briefing.

**These rules are about this vault only.** A project repo has its own instructions, and shell scripting there is normal and unrestricted by anything written here. Nothing in this file governs how you work in someone else's repository.

## Scope boundary

Conventions in this vault apply to **this vault only**. In a multi-root workspace, project repos have their own rules. Never apply vault conventions (branching, commit style, merge strategy) to a project repo unless that project's own instructions say to. Project repo instructions take precedence over this vault on any conflict.

## Tag-based scoping

Convention `tags` can scope content by audience:

- **Machine tags** (e.g. `[cachy]`, `[mac]`) — conventions specific to one host. Agents on other machines skip these.
- **Agent tags** (e.g. `[claude-code]`, `[codex]`) — agent-type-specific tuning. Each agent reads its own tag and ignores others.
- **Topic tags** (e.g. `[git]`, `[ci]`, `[infrastructure]`) — for search and filtering.

Tags are conventions, not enforcement — agents use them as guidance for what to read.

## Contributing

No PR gate on this vault. Commit directly. Trust the team. Git blame + git log = full audit trail. The `lint` skill handles hygiene.

**Every commit must be pushed immediately.** The vault is shared memory — a commit that stays local is invisible to the rest of the team and to agents running on other machines. Any skill that commits must push before it returns.
