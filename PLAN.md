# Synesis — Execution Plan

> **Name:** Synesis (Greek: σύνεσις — "understanding, the faculty of putting things together")
> **Repo:** the public framework/template repo
> **Dogfood:** a private instance — real team knowledge, dogfooding
> **What it is:** A file-based, repo-embedded, agent-agnostic shared knowledge protocol for software teams.
> **What it is not:** A SaaS product, an MCP server, an npm package, a database.

---

## The gap

Every AI coding agent (Claude Code, Codex, Copilot, and others) can read markdown files in a repo. None of them ship a convention for **shared team knowledge** — the kind that survives developer turnover, lives next to the code, and works regardless of which agent a developer uses.

Cortex proved the pattern for one person. Synesis is cortex for teams.

## Design principles

1. **Files, not services.** Markdown in a repo. No server, no database, no API keys. Clone and go.
2. **Agent-agnostic.** Works with any AI harness that reads project files. No vendor lock-in.
3. **Brand-neutral internals.** `PROTOCOL.md`, not `SYNESIS.md`. The brand lives in `README.md` and `EXAMPLE.md` only — never in the protocol files themselves. Zero rename cost.
4. **Trust the team.** No review gates on knowledge contributions. Anyone can commit. Git history is the audit trail. Friction kills adoption.
5. **Use the template and own it.** Teams create a vault with "Use this template" and make it theirs. The protocol defines the structure; the team fills it with real knowledge. There is **no fork relationship** — the histories are unrelated, so git cannot merge them. Upstream changes come down through `reconcile`, a file-level diff gated per file, never a merge or rebase.
6. **Obsidian-compatible.** The vault doubles as an Obsidian vault. `[[wikilinks]]` for internal linking, `aliases` and `tags` in frontmatter. `.obsidian/` is gitignored (per-user config).

## Repo model

- **The template repo** (public) — the framework. Protocol docs, example files, README. Teams use this as a GitHub template.
- **The dogfood instance** (private) — real people, real decisions, real conventions.

Same pattern as cortex: a public framework repo plus a private personal instance.

## Architecture

```
synesis/
  PROTOCOL.md                 # teaches any agent the conventions — version in frontmatter
  AGENTS.md                   # Codex entrypoint shim → PROTOCOL.md
  GEMINI.md                   # Gemini / Antigravity shim → PROTOCOL.md
  opencode.json               # OpenCode shim → PROTOCOL.md
  skills/                     # agent capabilities — flat files, one per skill
    archive.md
    catchup.md
    convention.md
    decide.md
    handoff.md
    hello.md
    lint.md
    note.md
    onboard.md
    propose.md
    reconcile.md
    search.md
    status.md
    sync.md
    update.md
    weave.md
    wire.md
  records/                    # institutional memory — decisions, ADRs
    _template.md
  people/                     # team member profiles
    _template.md
  conventions/                # how we do things here
    _template.md
  attachments/                # binary files linked to records (subfolder per record)
  tools/                      # team-shared scripts (ps1, sh, js, etc.)
    README.md
  CLAUDE.md                   # shim → PROTOCOL.md (Claude Code)
  .github/
    copilot-instructions.md   # shim → PROTOCOL.md (Copilot)
  README.md                   # branded: the pitch and the reference
  EXAMPLE.md                  # branded: a walkthrough of a vault first week; teams delete it
  synesis.code-workspace      # template multi-root workspace
  .gitignore                  # ignores .obsidian/ (per-user Obsidian config)
```

Top-level layout, no dot-prefix. This is a cloned repo, not a config directory nested inside another project. The framework (public template) ships `_template.md` files and example skills. Teams create from the template and fill in real content.

**Naming convention:** UPPERCASE filenames (`PROTOCOL.md`, `AGENTS.md`) are protocol infrastructure. Lowercase filenames (`onboard.md`, `sarah.md`, `git.md`) are team content. The casing tells you at a glance what's plumbing and what's knowledge.

**Linking convention:** Use `[[wikilinks]]` for all internal cross-references. Skills that create content (decide, onboard) write links at creation time. The lint skill validates that links resolve to real files. Wikilinks are native to Obsidian and readable by AI agents as plain text.

## Harness shims

Each AI harness has its own entrypoint file. Synesis ships a one-line shim for each supported harness that redirects into `PROTOCOL.md`:

| Harness | Mode | Shim file | Content |
|---|---|---|---|
| Claude Code | CLI + VS Code | `CLAUDE.md` | Read and follow PROTOCOL.md |
| OpenAI Codex | CLI + VS Code | `AGENTS.md` | Read and follow PROTOCOL.md |
| GitHub Copilot | CLI + VS Code | `.github/copilot-instructions.md` | Read and follow PROTOCOL.md |
| Gemini / Antigravity | CLI | `GEMINI.md` | Read and follow PROTOCOL.md |
| OpenCode | CLI | `opencode.json` | `"instructions": ["PROTOCOL.md"]` |

Five harnesses supported at launch. Adding a new harness = adding a one-line shim file. The actual knowledge stays in one place.

## VS Code multi-root workspace

Developers using VS Code-based harnesses (Claude Code, Codex, Copilot — all have VS Code extensions) work in a **multi-root workspace** that includes synesis alongside their project repos:

```json
{
  "folders": [
    { "path": "../synesis" },
    { "path": "../my-al-project" },
    { "path": "../another-al-project" }
  ]
}
```

All harnesses except OpenCode auto-discover their shim files from workspace folders in multi-root workspaces; OpenCode reads `opencode.json` in the vault root. Copilot had a bug with this ([vscode#264837](https://github.com/microsoft/vscode/issues/264837)) but it was fixed in September 2025.

The agent sees both synesis and the project. When working in the project and needing team context — conventions, ownership, past decisions — synesis is right there in the workspace.

The public framework ships a template `.code-workspace` file. Teams customize it with their own project paths.

Terminal/CLI users set up cross-repo access once per developer. Each harness has a different mechanism:

| Harness | Cross-repo mechanism |
|---|---|
| Claude Code | Global instruction file: `~/.claude/CLAUDE.md` — one line pointing to the vault (handles both instruction discovery and file access) |
| Antigravity | Global instruction file: `~/.gemini/GEMINI.md` — one line pointing to the vault + `--add-dir` flag for file access |
| Codex CLI | Personal skill: `~/.codex/skills/synesis/SKILL.md` with `alwaysApply: true` + `--add-dir` flag for file access |
| Copilot CLI | Personal skill: `~/.copilot/skills/synesis/SKILL.md` with `alwaysApply: true` + `--add-dir` flag for file access |
| OpenCode | Global skill: `~/.config/opencode/skills/synesis/SKILL.md` + `references` entry in `~/.config/opencode/opencode.json` for file access |

The `wire` verb prints these, filled in with the vault's real absolute path and only for the harnesses actually installed. It never writes them — the files involved load in every project on the machine, so applying them stays the developer's call.

### Multi-root risks

| Risk | Mitigation |
|---|---|
| Conflicting agent instructions (both repos have CLAUDE.md) | Documented precedence rule: project repo overrides synesis on conflicts |
| Accidental cross-repo commits | Git catches this (different working trees) — document the foot-gun |
| Context window bloat | Keep synesis lean; agents index both repos |
| Copilot code suggestions polluted by prose | Minor — monitor during dogfooding |


## Versioning

Major.minor in `PROTOCOL.md` frontmatter. Started at **v0.1**; currently **v0.8**.

- **Minor bump:** add/change a convention, new verb, new template
- **Major bump:** breaking change to directory structure or PROTOCOL.md format

Instances track upstream version: `upstream: <org>/synesis@v0.8` in their PROTOCOL.md frontmatter. That field is **provenance** — the version the vault was created at, and the repo `hello` derives its upstream remote from.

What the vault last *synced to* is a different number, and lives in `.synesis-version` at the repo root. `reconcile` writes it at the end of a completed run; `hello` reads it, compares against the newest upstream tag, and appends one line when there is something newer. It is deliberately not frontmatter: `PROTOCOL.md` is in template scope, so a version written there would report as drift on every vault that is behind.

**Releases are tagged.** A tag-based signal only exists if someone tags — an untagged release leaves every vault reporting itself current while the template moves.

## What carries over from cortex

| Cortex concept | Synesis equivalent | Changes |
|---|---|---|
| CORTEX.md | PROTOCOL.md | Brand-neutral name, versioned |
| Records | records/ | Add attribution (who wrote it, when), `status`/`superseded-by` tracking |
| Verbs (hello, goodbye, sync) | `skills/` frontmatter | Verbs derived from skill files, no separate index |
| Skills | skills/ | Carry over, flattened — no actor wrapper. Skills define their own triggers |
| Fork model | Same pattern | Teams use the template and own their copy |
| Actor profiles | Dropped | Actors absorbed into skills — functional roles with triggers, no personalities |
| Personal daily journal | Dropped | Not relevant at team level |
| Record immutability | Same rule | Records are append-only; correct by superseding. Frontmatter still maintained in place |
| Weave (record linking) | `weave` verb | Same derived `## Related` block, same conservative linking. Covers conventions too, skips people profiles |
| Reconcile | `reconcile` verb | Rewritten for template repos: no fork relationship, unrelated histories, file-level diff only — never merge or rebase |
| Verb precedence over parent | Same rule | Vault verbs beat any parent instruction file; precedence is not composition |
| Rollup layer | Deferred | Solves unbounded daily-record growth; decision vaults are low-volume. Revisit past ~50 records |
| Actor profiles / personalities | Dropped | Personal-life surface, no team-knowledge analogue |

## New features (not in cortex)

### 1. People directory
`people/` folder with one markdown per team member. Role, expertise areas, what they own. Agents use this to answer "who should I ask about X?" and to attribute context correctly. Real profiles live in private instances only — the public repo ships `_template.md`.

### 2. Onboarding mode
New dev clones the vault, opens their harness. The agent reads `git config user.name` and `git config user.email` to identify the current user, then checks `people/` for a matching profile. No match triggers the onboarding flow:

1. **Interview:** Agent asks the developer for their name, initials, role, and expertise areas.
2. **Create profile:** Agent writes `people/{name}.md` with the collected info.
3. **Commit and push:** Agent commits the new profile and pushes to the vault. The team now knows who joined.
4. **Briefing:** Agent delivers the full onboarding catch-up — architecture overview, active work, team conventions, who owns what.

Returning devs (profile already exists) skip straight to the briefing on `hello`.

The interview is lightweight — 4-5 questions, not a form. The agent drives it conversationally. Example:

```
Agent: Welcome to [team]. I don't have a profile for you yet.
       What's your name?
Dev:   Sarah Chen
Agent: Initials?
Dev:   SC
Agent: What's your role on the team?
Dev:   Frontend developer
Agent: What areas will you be working on?
Dev:   Auth UI, dashboard components
Agent: Got it. I've created your profile and pushed it.
       Let me catch you up on how the team works...
```

### 3. Skills
`skills/` folder with flat markdown files — one per skill. Each skill defines its own triggers and instructions. No actor wrapper layer. The agent reads skill files to know what it can do and when to activate.

### 4. Decision log with attribution
Records include who decided, who was consulted, and why. Prevents relitigating settled decisions. Records can be marked `superseded` and linked to their replacement via `superseded-by`.

### 5. Knowledge freshness
Each record carries a `last-verified` date in frontmatter. The `lint` skill flags records older than N days (configurable in PROTOCOL.md) as stale. No automated deletion — just visibility.

### 6. Conventions as code
`conventions/` folder replaces tribal knowledge. Git branching strategy, commit message format, deployment process, coding standards — all in markdown, all agent-readable. New devs and new agents get the same briefing.

### 7. Attachments
`attachments/` folder stores binary files linked to records. Subfolder per record, named to match the record filename. Convention: if `attachments/{record-name}/` exists, those files belong to that record.

### 8. Shared tooling
`tools/` folder for team-shared scripts (PowerShell, bash, Node, etc.) that don't belong in any single project repo. `tools/README.md` is the index — lists what's available and how to use each script.

### 9. Contribution workflow
No PR gate. Commit directly to synesis. Trust the team. Git blame + git log = full audit trail. The `lint` skill handles hygiene.

## Frontmatter spec

**`PROTOCOL.md`**
```yaml
---
version: 0.8
upstream: <org>/synesis@v0.8
stale-days: 90
---
```

**`skills/*.md`**
```yaml
---
name: onboard
description: Onboards new team members — interview, profile creation, briefing
triggers:
  - no matching people/ profile on hello
  - onboard verb
---
```

**`records/*.md`**
```yaml
---
title: Auth provider decision
date: 2026-08-18
decided-by: [SC, MK]
consulted: [JL]
last-verified: 2026-08-18
type: decision          # decision | note — omit for decision
status: active          # proposed | active | superseded
superseded-by:
tags: [auth, architecture]
archived: true          # optional; set by the archive verb
---
```
`type` is `decision` (the default, omitted in practice) or `note`. A note records what was found rather than what was chosen — a postmortem, a benchmark, a research result — and carries no `decided-by`, which lint check 3 skips for it. A running list that is edited forever is neither, and belongs in `conventions/`.

`status` is `proposed`, `active` or `superseded` — the ADR lifecycle. `propose` opens a record as `proposed` with the Decision section empty; `decide` writes the decision and flips it to `active`; a later `decide` supersedes it. A `proposed` record is mutable while the question is open; immutability applies from acceptance onward. When superseded, `superseded-by` links to the replacement record filename. The lint skill validates that `superseded-by` targets an existing file. `tags` enable Obsidian filtering and agent search. `archived` is optional and set by the `archive` verb — archived files drop out of `hello`, `status`, `lint` and `weave`, but stay findable by `search`, which labels them.

**Records are append-only** — the body is never edited after filing. Correct a decision by filing a replacement and setting `superseded-by` on the old one. Frontmatter fields above are still maintained in place; that is not a violation.

Two kinds of link, not interchangeable:

- **Authored** — `[[wikilinks]]` written by hand in body prose: `[[people/sarah]]`, `[[conventions/git]]`, `[[records/2026-08-20-api-redesign]]`. Yours to write anywhere.
- **Derived** — the `## Related` block at the end of the file. Only `weave` writes it, never hand-written, even when filing.

**`people/*.md`**
```yaml
---
name: Sarah Chen
initials: SC
aliases: [SC, Sarah]
email: sarah.chen@company.com
role: Frontend developer
joined: 2026-08-18
last-seen: 2026-08-18
tags: [frontend, auth]
---
```
`email` is matched against `git config user.email` for automatic user detection during onboarding. `aliases` let Obsidian resolve `[[SC]]` to this profile. `tags` mark expertise areas. `last-seen` is owned by `catchup` alone — `onboard` seeds it, and nothing else writes it (see Field ownership under Verb definitions).

**`conventions/*.md`**
```yaml
---
name: Git branching strategy
last-verified: 2026-08-18
tags: [git, workflow]
archived: true          # optional; set by the archive verb
---
```
Conventions are living documents — edit them in place and bump `last-verified`. Unlike records, they carry no immutability rule. Keep a quirk in the file that owns the task it belongs to; a rule duplicated across two conventions goes stale in one of them.

## Verification method

Reading a skill and running it find different bugs. Of ten bugs fixed at v0.2–v0.3, seven came from reading the specs against each other and three from executing the verbs — and all three of those were in files a spec pass had just cleared. Claims about behaviour ("regeneration is identical", "skips archived files") read as reassurance until something is actually run. Execute new verbs against the dogfood vault before promoting them upstream.

## Lint skill checks

The `lint` skill scans the repo for hygiene issues. No automated fixes — it reports what it finds and the developer decides.

1. **Stale knowledge** — records and conventions where `last-verified` is older than N days (configurable in PROTOCOL.md)
2. **Broken links** — `superseded-by` or `[[wikilinks]]` pointing to a file that doesn't exist
3. **Missing attribution** — records without `decided-by`
4. **Orphaned profiles** — people profiles where `email` doesn't match any recent git author
5. **Empty templates** — files that are still just the `_template.md` content, never filled in
6. **Unanswered proposals** — records with `status: proposed` older than `stale-days`. An open question nobody revisits is litter; resolve with `decide` or `archive` it.
7. **Weave block integrity** — non-reciprocal links, unpaired or duplicated `weave:start`/`weave:end` markers, empty weave blocks, `## Related` headings without markers
8. **Vault references in template files** — `[[wikilinks]]` in `PROTOCOL.md`, `AGENTS.md`, `skills/*.md` or `*/_template.md` that resolve to a real file in this vault. Inverts check 2: template files must use placeholders that resolve nowhere, since they ship to vaults that have none of this content. Scans inside code blocks too — that is where these get written.

Checks stay agent-native: the skill is prose the agent executes, not a script. No runtime, nothing to install.

## Verb definitions

Each verb maps 1:1 to a skill file in `skills/`. The agent discovers verbs by reading skill frontmatter (`name` + `description`). No separate VERBS.md index — single source of truth in `skills/`.

**Field ownership.** Where two verbs touch the same frontmatter field, exactly one owns it. `last-seen` is owned by `catchup` — `hello` must not write it, or the "what changed since I was last here" baseline is destroyed on every greeting. Any future verb that wants a per-person timestamp gets its own field rather than sharing this one.

## Phases

### Phase 1 — Protocol scaffold
- [x] Define PROTOCOL.md with v0.1 frontmatter
- [x] Define AGENTS.md (Codex entrypoint shim)
- [x] Define verb set (verbs derived from skills/ frontmatter, no separate VERBS.md)
- [x] Define directory structure and frontmatter conventions
- [x] Write harness shim files (CLAUDE.md, AGENTS.md, .github/copilot-instructions.md)
- [x] Write skill files (hello, status, onboard, decide, handoff, lint, search, sync, archive, catchup, update)
- [x] Create `_template.md` files for records, people, conventions
- [x] Create template synesis.code-workspace file
- [x] Create attachments/ and tools/ directories with README
- [x] Write README.md (the only branded file)

### Phase 2 — Dogfood
- [x] Create the private dogfood instance from the template
- [x] Populate with real team knowledge (conventions, people, architecture)
- [x] Test with Claude Code (hello, lint, decide verbs — 6 bugs found and fixed)
- [x] Test multi-root workspace scope boundary (convention bleed test passed)
- [x] Iterate on protocol based on real usage (tag-based scoping, scope boundary, librarian absorption)
- [x] Test with Copilot CLI harness (hello verb, cross-repo via personal skill + --add-dir)
- [x] Test with Codex CLI harness (hello verb, cross-repo via personal skill + --add-dir)
- [x] Test with Antigravity CLI harness (hello verb, cross-repo via global GEMINI.md + --add-dir)
- [x] Test with OpenCode CLI harness (hello verb, cross-repo via global skill + references config)
- [x] Port proven cortex features — record immutability, `weave`, `reconcile`, verb precedence (protocol v0.2)
- [x] Audit skill interactions after the port — three bugs found and fixed:
  - `hello` overwrote `last-seen`, destroying the baseline `catchup` reads. `catchup` now owns the field alone.
  - `decide` told the agent to hand-write links; the `## Related` block is derived and belongs to `weave`.
  - `archive` left inbound links pointing at archived files. `weave` no longer links to them; `archive` re-runs it.
- [x] Second spec pass — `PROTOCOL.md` still licensed hand-written Related blocks (and its example showed a link `weave` cannot make); `search` never labelled archived hits; `sync` looked like the answer for template drift.
- [x] Add the `note` record type and verb (protocol v0.6). `records/` was decision-shaped: everything that wrote one assumed a choice had been made, so a postmortem or a benchmark had to fake `decided-by` to pass lint. `type: decision | note`, defaulting to decision. Surfaced by the dogfood vault, where the ideas index carried invented attribution and — being a living list — also broke immutability. It moved to `conventions/`.
- [x] Add the `propose` verb and the `proposed` record state (protocol v0.5). `decide` only ever filed finished decisions, so the reasoning while options were live had nowhere to live — the missing half of the standard ADR lifecycle. `decide` is now resolve-or-create; immutability is scoped to accepted records. Dogfooding it immediately exposed that `PROTOCOL.md` never said whether dates are local or UTC.
- [x] Add the `convention` verb (protocol v0.4). `decide` filed records and `onboard` filed profiles, but nothing authored a convention — the one artifact a user had to hand-write, frontmatter and all. Found while writing EXAMPLE.md, which had to fudge it as "plain files; no verb required".
- [x] **Execute every verb rather than reading it** (protocol v0.3). Three further bugs, each in a file the spec passes had already cleared:
  - `weave` only *skipped* archived files, so an archived file kept a frozen block pointing at records that no longer pointed back.
  - `reconcile`'s categorization never mapped git's status letters — `D` means "upstream has it, you don't", which reads as "deleted" and resolves backwards.
  - `weave` claimed regeneration was identical and idempotent. Link selection and order are pinned; the prose after the em-dash is not, so every run rewrote all 68 descriptions and churned 26 files.

### Phase 3 — Polish
- [x] Lint verb implementation (agent-native, no shell scripts)
- [x] Add the `wire` verb (protocol v0.7). A vault was invisible to any session started outside its folder, and setup was manual, README-only, and written with example paths no machine matches — so it did not happen, and the result read as "Synesis does not do much" rather than "Synesis was never switched on". `wire` prints the config rather than applying it: the files involved load in every project on the machine, and printing is idempotent by definition — no marker to manage, no JSON to merge, no per-OS write path. Its own verb, not an `onboard` step, because wiring is per-machine and profiles are per-person.
- [x] Ship a LICENSE (protocol v0.7). The README had claimed MIT since the first commit and no LICENSE file existed, so GitHub detected none. `reconcile` names it out of scope: copying it into a private vault puts this repo's copyright on the team's own records.
- [x] Version nudge (protocol v0.8). A vault only learned it was behind when someone ran `reconcile` on a hunch. `hello` now reads `.synesis-version` against the newest upstream tag and says one line when there is something newer, bounded with git's own ssh and http options so a briefing never stalls on a fetch.
- [x] Narrow the shell grant (protocol v0.8). The template shipped `Bash(*)` — unrestricted shell, pre-approved for anyone who opens a vault, inherited rather than chosen. Every skill shells out to git and nothing else. Narrowing it to `Bash(git:*)` surfaced three skills that quietly depended on `sort`, `comm`, `diff` and `sed`; all now use git-only equivalents.
- [ ] Onboarding flow testing with a real new developer
- [ ] Documentation site (if warranted)

### Phase 4 — Public launch
- [x] Final naming decision — **Synesis**
- [x] README, examples, getting-started guide
- [ ] Announce

---

*Filed: 2026-08-22*
*Updated: 2026-08-24*
*Name: Synesis*
*Status: Phase 3 substantially complete — five harnesses tested, cortex feature port shipped, every verb executed against the dogfood vault, `wire` and the version nudge shipped, the shell grant narrowed to git. Protocol v0.8. Remaining: onboarding flow with a real new developer, then announce.*
