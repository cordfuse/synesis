---
version: 1.8
upstream: cordfuse/synesis
stale-days: 90
---

# Protocol

This is a shared knowledge vault for a software team — decisions, conventions, people and institutional memory as plain markdown in a git repo. Any AI coding agent that can read a file can use it to understand how your team works.

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

Use `[[wikilinks]]` for all internal cross-references: `[[people/example-person]]`, `[[conventions/example-workflow]]`, `[[records/2026-08-20-api-redesign]]`. The lint skill validates that links resolve to real files.

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
deadline: YYYY-MM-DD         # optional — a future date the team must act on; see Freshness
status: proposed | accepted | rejected   # decisions only; omit entirely on a note
superseded-by: filename (when a later record replaces this one)
tags: [...]
```

### People
```yaml
name: ...
initials: ...
aliases: [...]       # other names *or* email addresses this person appears as in git history
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
deadline: YYYY-MM-DD    # optional — a future date the team must act on; see Freshness
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

On first interaction, read `git config user.name` and `git config user.email` to identify the current user. Match against profiles in `people/`: `email` first, then the entries in `aliases`. People commit under more than one address — a work account, a personal one, a `noreply` address a forge rewrote — and matching one field only would onboard the same person twice. Run the onboard skill when neither matches.

## Verbs

Verbs are commands a developer gives to the agent. Each verb maps to a skill file in `skills/`. The agent reads `skills/*.md` frontmatter (`name` + `description`) to discover available verbs.

**A vault's verbs override any parent instruction file's definition of the same name.** When this vault sits inside a larger workspace whose root `CLAUDE.md` / `AGENTS.md` defines its own session verbs — `hello`, `sync`, `status`, `goodbye` — the vault wins inside this directory and everything below it. Reserved: every name in `skills/*.md` frontmatter. A parent defining a name the vault does not reserve passes through untouched.

Precedence is not composition. Run the vault's version only — two briefings in one turn is the failure this rule prevents.

## Versioning

This protocol is at **v1.8**. Minor bumps add conventions or verbs. Major bumps change directory structure or this file's format.

## Releasing the protocol

**This section is for the template repo only.** A vault never releases a protocol; it receives one through `reconcile`.

A release changes the version in **two** places in this file — the `version:` field in frontmatter and the sentence in **Versioning** — then commits both, then tags that commit with an **annotated** tag `vX.Y`, then pushes with `--follow-tags`.

```sh
git commit -q -F -          # both version edits in one commit
git tag -a vX.Y -m "Protocol vX.Y"
git push origin main --follow-tags
```

A lightweight tag will not do: `--follow-tags` pushes annotated tags only, so a lightweight one stays on the releaser's machine and no vault ever sees it.

**The newest tag always equals the `version:` field at HEAD.** That invariant is the whole mechanism: the `hello` verb in every downstream vault compares its own `version:` against the newest tag it fetched, and nothing else. A bump without a tag means no vault is ever nudged; a tag without the bump nudges every vault forever. Neither error reports itself — the template looks fine from inside, and the damage shows up only as vaults that never update or never stop asking.

## Dates

Every `date` and `last-verified` field uses the **machine local date**, not UTC.

**Never infer the date.** Run `date +%F` and use what it returns. Guessing produces records that are silently wrong by a day, and `catchup` and `lint` both do arithmetic on these fields.

## Freshness

Records and conventions carry a `last-verified` date. The `lint` skill flags anything older than the `stale-days` threshold in this file's frontmatter (default: 90 days). The `update` skill resolves stale flags by re-verifying content and bumping the date.

**`last-verified` looks backward; `deadline` looks forward.** A file whose content names a date the team must act on — a certificate expiry, a contract renewal, a sunset — carries an optional `deadline: YYYY-MM-DD`, set to the date the thing happens. `hello` and `status` surface any deadline within 60 days, and `lint` flags one that has passed. Without the field, a date in body prose is invisible until it is history — a vault that cannot warn about the future is an archive, not memory. When the event is handled or moves, update or remove the field; like `last-verified`, it is maintained in place.

## Archiving

Records and conventions can be marked `archived: true` in frontmatter. Archived files are skipped by `hello`, `status`, and `lint` but still discoverable via `search`. Use the `archive` skill to set the flag. Remove it to restore.

**Archiving is not rejection.** An archived proposal stopped mattering before anyone answered it. A `rejected` record is one the team deliberately turned down, and it stays visible — its value is stopping the same idea returning in six months. Never archive a proposal to record a no.

## Record types

`records/` holds two kinds of file, distinguished by `type`:

| type | Is | Filed by | `decided-by` | `status` |
|---|---|---|---|---|
| `decision` (default) | what the team **chose** | `propose` → `decide`, or `handoff` | Yes | Yes |
| `note` | what the team **found** — a postmortem, a benchmark, a research finding | `note` | No | **No field at all** |

A record with no `type` is a decision. Both are immutable once filed and both supersede the same way. A note has no options, no attribution and no decision to make, so it carries no `status` — forcing a finding through the decision template produces a record that lies about how it came to exist.

**A running list that gets edited forever is neither.** An index, a backlog, a catalogue — anything appended to and revised — belongs in `conventions/`, which is living by design. Records are snapshots.

## Record immutability

A decision moves through three states, and `status` records only which one it reached:

| status | Meaning | Mutable? |
|---|---|---|
| `proposed` | an open question — nobody has chosen | **Yes** — that is the point |
| `accepted` | answered yes | No |
| `rejected` | answered no | No |

`propose` opens a record and `decide` answers it, either way. Notes carry no `status` at all.

**Whether a record is still current is a separate question, and `superseded-by` answers it.** A record carrying that field has been replaced by a later one. Its `status` does not change, because what the team decided then is still what it decided. "Superseded" is derived from the pointer and never stored as a state — which is what lets a reversed rejection stay `rejected` and gain a pointer, a pair one field could not express.

**Once answered, a record's body is not edited.** To correct or change one, file a **new** record and set `superseded-by` on the old one. Both stay in the vault; the chain is the history. A decision you can quietly rewrite is a draft, and the audit trail becomes worthless.

**Frontmatter is not body.** These fields are maintained in place, and doing so is not a violation:

- `last-verified` — bumped by the `update` skill
- `deadline` — updated or removed as the event it names moves or is handled
- `status` — set by `decide` when a proposal is answered
- `superseded-by` — set when a later record replaces this one
- `archived` — set by the `archive` skill

**Moved link targets may be repointed.** Immutability protects a record's *claims*, not its *pointers* — a stale link makes the record wrong, which is the opposite of what the rule is for. The sentence around the link must not change.

**The sole body exception** is the derived `## Related` block at the end of a record, which `weave` owns. Nothing above that block is ever touched.

**This applies to answered records only.** A `proposed` record is still being written — edit it freely until `decide` answers it, at which point it freezes either way. Conventions and people profiles are living documents: edit them in place and bump `last-verified`.

## Record linking (`weave`)

A vault carries two kinds of link, and they are not interchangeable:

- **Authored links** — `[[wikilinks]]` written by hand in body prose, where a sentence genuinely explains a connection. Yours to write, anywhere, at any time. `weave` never touches them.
- **The derived `## Related` block** — a generated index at the end of each record and convention. **Only `weave` writes it.** Never hand-write one, not even when filing a new record; file the record, then run `weave`.

It carries a marker so it is never mistaken for authored prose, and every run regenerates it from scratch:

```markdown
## Related

<!-- weave:start -->
- [[conventions/example-workflow]] — the convention this decision assumes
<!-- weave:end -->
```

Links are conservative: a real relationship, not topical adjacency. `weave` covers `records/` and `conventions/` and skips `people/`, since every record carries `decided-by` and linking people would put the same profile in every block. Archived files are handled in both directions — nothing links to them, and any block they still carry is removed rather than left frozen. See `skills/weave.md` for the rules.

## Working in this vault

**Read files with your file tools, not through a shell.** Reading many files at once is still reading, and every harness has tools for it. Do not shell out to PowerShell, bash or anything else to read, list, grep or parse files here. Shell access in this vault is for `git` and `date`, and nothing else — `.claude/settings.json` grants exactly those two on purpose, and a skill that needs more is a skill that has gone wrong. `date` is there because **Dates** above requires reading the date rather than inferring it, which no file tool can do.

**This holds over harness-level instructions too.** A session-wide directive to prefer shell tooling — Claude Code's auto mode issues one — does not apply inside this vault. It is a general-purpose default written without knowledge of where it would land; this is a specific rule with a measured reason, and the specific rule wins. Follow it here and go back to the harness default the moment you leave.

**How you address the repo depends on where the session started.** When the vault **is** the working directory, run git plainly — `git config user.name`, `git status`. No `-C`, no `cd`. When it is **not** — a session that reached this vault through wiring — use `git -C <vault-path>`.

**Never `cd <vault-path>; git ...`.** Command approvals match on the *stem* of the command, and the stem of that compound is `cd`, not `git`. No git allow-rule can match it, and the only rule that would — `shell(cd:*)` — permits any command following a `cd`, which is a blanket shell grant wearing a disguise. `git -C` keeps the stem `git`, so one narrow rule covers every call the protocol makes.

**One git call per command. No variable assignment, no chaining, no pipes.** Approvals are matched per sub-command, so anything that is not a git call is a sub-command no git rule can match. A vault path held in a shell variable also defeats any rule scoped to that path. Let your harness hold the results — you do not need `head`, `Select-Object` or `findstr` to take the first lines of output it already hands you in full.

**Do not append shell redirections to git calls** — no `2>&1`, no `>`. A redirection creates or modifies a file, so approval systems classify the whole command as a *write* rather than as git, and only an allow-everything grant permits it. Your harness already captures stderr and hands it to you.

**If something outside this repository cannot be read, say so and carry on.** A check that hits a refused path is not a reason to retry it through a shell. Report what could not be confirmed and finish.

**These rules are about this vault only.** A project repo has its own instructions, and shell scripting there is normal and unrestricted by anything written here.

## Scope boundary

Conventions in this vault apply to **this vault only**. In a multi-root workspace, project repos have their own rules. Never apply vault conventions (branching, commit style, merge strategy) to a project repo unless that project's own instructions say to. Project repo instructions take precedence on any conflict.

## Tag-based scoping

Convention `tags` can scope content by audience:

- **Machine tags** (e.g. `[cachy]`, `[mac]`) — conventions specific to one host. Agents on other machines skip these.
- **Agent tags** (e.g. `[claude-code]`, `[codex]`) — agent-type-specific tuning. Each agent reads its own tag and ignores others.
- **Topic tags** (e.g. `[git]`, `[ci]`, `[infrastructure]`) — for search and filtering.

Tags are conventions, not enforcement — agents use them as guidance for what to read.

## Contributing

No PR gate on this vault. Commit directly. Trust the team. Git blame + git log = full audit trail. The `lint` skill handles hygiene.

**Every commit must be pushed immediately.** The vault is shared memory — a commit that stays local is invisible to the rest of the team and to agents running on other machines. Any skill that commits must push before it returns.

**A rejected push is not a licence to force.** A push refused because the remote moved means someone else pushed first, and their work is not yours to discard. Run one bounded `git pull --rebase` — the same bounding options as the fetch in `skills/hello.md` — then push once more. If the rebase conflicts, or the second push is refused too, report and stop: never `--force`, and never resolve a conflict on your own judgment. This applies to every verb that commits.
