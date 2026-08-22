# Synesis — Execution Plan

> **Name:** Synesis (Greek: σύνεσις — "understanding, the faculty of putting things together")
> **Repo:** cordfuse/synesis (public) — the framework/template
> **Dogfood:** steve-krisjanovs/synesis (private) — real team knowledge, dogfooding
> **What it is:** A file-based, repo-embedded, agent-agnostic shared knowledge protocol for software teams.
> **What it is not:** A SaaS product, an MCP server, an npm package, a database.

---

## The gap

Every AI coding agent (Claude Code, Codex, Copilot, and others) can read markdown files in a repo. None of them ship a convention for **shared team knowledge** — the kind that survives developer turnover, lives next to the code, and works regardless of which agent a developer uses.

Cortex proved the pattern for one person. Synesis is cortex for teams.

## Design principles

1. **Files, not services.** Markdown in a repo. No server, no database, no API keys. Clone and go.
2. **Agent-agnostic.** Works with any AI harness that reads project files. No vendor lock-in.
3. **Brand-neutral internals.** `PROTOCOL.md`, not `SYNESIS.md`. The brand lives in the README and docs, never in the protocol files themselves. Zero rename cost.
4. **Trust the team.** No review gates on knowledge contributions. Anyone can commit. Git history is the audit trail. Friction kills adoption.
5. **Fork and own.** Teams fork the template and make it theirs. The protocol defines the structure; the team fills it with real knowledge. Upstream pulls are rare — git handles conflicts when they happen.
6. **Obsidian-compatible.** The vault doubles as an Obsidian vault. `[[wikilinks]]` for internal linking, `aliases` and `tags` in frontmatter. `.obsidian/` is gitignored (per-user config).

## Repo model

- **`cordfuse/synesis`** (public) — the framework/template. Protocol docs, example files, README. Teams fork this.
- **`steve-krisjanovs/synesis`** (private) — Steve's fork. Real people, real decisions, real conventions. Dogfood repo.

Same pattern as cortex: `cordfuse/cortex` = framework, `steve-krisjanovs/cortex` = personal instance.

## Architecture

```
synesis/
  PROTOCOL.md                 # teaches any agent the conventions — version in frontmatter
  AGENTS.md                   # Codex entrypoint shim → PROTOCOL.md
  skills/                     # agent capabilities — flat files, one per skill
    hello.md
    status.md
    onboard.md
    decide.md
    handoff.md
    lint.md
    search.md
    sync.md
  records/                    # institutional memory — decisions, ADRs
    _template.md
  people/                     # team member profiles
    _template.md
  conventions/                # how we do things here
    _template.md
  attachments/                # binary files linked to records
    2026-08-18-auth-decision/
      diagram.png
  tools/                      # team-shared scripts (ps1, sh, js, etc.)
    README.md
  CLAUDE.md                   # shim → PROTOCOL.md (Claude Code)
  .github/
    copilot-instructions.md   # shim → PROTOCOL.md (Copilot)
  README.md                   # the only branded file
  synesis.code-workspace      # template multi-root workspace
  .gitignore                  # ignores .obsidian/ (per-user Obsidian config)
```

Top-level layout, no dot-prefix. This is a cloned repo, not a config directory nested inside another project. The framework (public template) ships `_template.md` files and example skills. Teams fork and fill in real content.

**Naming convention:** UPPERCASE filenames (`PROTOCOL.md`, `AGENTS.md`) are protocol infrastructure. Lowercase filenames (`onboard.md`, `sarah.md`, `git.md`) are team content. The casing tells you at a glance what's plumbing and what's knowledge.

**Linking convention:** Use `[[wikilinks]]` for all internal cross-references. Skills that create content (decide, onboard) write links at creation time. The lint skill validates that links resolve to real files. Wikilinks are native to Obsidian and readable by AI agents as plain text.

## Harness shims

Each AI harness has its own entrypoint file. Synesis ships a one-line shim for each supported harness that redirects into `PROTOCOL.md`:

| Harness | Mode | Shim file | Content |
|---|---|---|---|
| Claude Code | CLI + VS Code | `CLAUDE.md` | Read and follow PROTOCOL.md |
| OpenAI Codex | CLI + VS Code | `AGENTS.md` | Read and follow PROTOCOL.md |
| GitHub Copilot | CLI + VS Code | `.github/copilot-instructions.md` | Read and follow PROTOCOL.md |

All three harnesses have both CLI and VS Code extensions. Three harnesses supported at launch. Adding a new harness = adding a one-line shim file. The actual knowledge stays in one place.

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

All three harnesses auto-discover their shim files from workspace folders in multi-root workspaces. Copilot had a bug with this ([vscode#264837](https://github.com/microsoft/vscode/issues/264837)) but it was fixed in September 2025.

The agent sees both synesis and the project. When working in the project and needing team context — conventions, ownership, past decisions — synesis is right there in the workspace.

The public framework ships a template `.code-workspace` file. Teams customize it with their own project paths.

Terminal users (Claude Code CLI, Codex CLI) open a separate session on the synesis repo as needed.

### Multi-root risks

| Risk | Mitigation |
|---|---|
| Conflicting agent instructions (both repos have CLAUDE.md) | Documented precedence rule: project repo overrides synesis on conflicts |
| Accidental cross-repo commits | Git catches this (different working trees) — document the foot-gun |
| Context window bloat | Keep synesis lean; agents index both repos |
| Copilot code suggestions polluted by prose | Minor — monitor during dogfooding |


## Versioning

Major.minor in `PROTOCOL.md` frontmatter, starting at **v0.1**.

- **Minor bump:** add/change a convention, new verb, new template
- **Major bump:** breaking change to directory structure or PROTOCOL.md format

Private forks track upstream version: `upstream: cordfuse/synesis@v0.1` in their PROTOCOL.md frontmatter.

## What carries over from cortex

| Cortex concept | Synesis equivalent | Changes |
|---|---|---|
| CORTEX.md | PROTOCOL.md | Brand-neutral name, versioned |
| Records | records/ | Add attribution (who wrote it, when), `status`/`superseded-by` tracking |
| Verbs (hello, goodbye, sync) | `skills/` frontmatter | Verbs derived from skill files, no separate index |
| Skills | skills/ | Carry over, flattened — no actor wrapper. Skills define their own triggers |
| Fork model | Same pattern | Teams fork the template and own their copy |
| Actor profiles | Dropped | Actors absorbed into skills — functional roles with triggers, no personalities |
| Personal daily journal | Dropped | Not relevant at team level |

## New features (not in cortex)

### 1. People directory
`people/` folder with one markdown per team member. Role, expertise areas, what they own. Agents use this to answer "who should I ask about X?" and to attribute context correctly. Real profiles live in private forks only — the public repo ships `_template.md`.

### 2. Onboarding mode
New dev clones the fork, opens their harness. The agent reads `git config user.name` and `git config user.email` to identify the current user, then checks `people/` for a matching profile. No match triggers the onboarding flow:

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
version: 0.1
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
status: active
superseded-by:
tags: [auth, architecture]
---
```
`status` is `active` or `superseded`. When superseded, `superseded-by` links to the replacement record filename. The lint skill validates that `superseded-by` targets an existing file. `tags` enable Obsidian filtering and agent search.

Use `[[wikilinks]]` in the body to cross-reference other files: `[[people/sarah]]`, `[[conventions/git]]`, `[[records/2026-08-20-api-redesign]]`.

**`people/*.md`**
```yaml
---
name: Sarah Chen
initials: SC
aliases: [SC, Sarah]
email: sarah.chen@company.com
role: Frontend developer
joined: 2026-08-18
tags: [frontend, auth]
---
```
`email` is matched against `git config user.email` for automatic user detection during onboarding. `aliases` let Obsidian resolve `[[SC]]` to this profile. `tags` mark expertise areas.

**`conventions/*.md`**
```yaml
---
name: Git branching strategy
last-verified: 2026-08-18
tags: [git, workflow]
---
```

## Lint skill checks

The `lint` skill scans the repo for hygiene issues. No automated fixes — it reports what it finds and the developer decides.

1. **Stale knowledge** — records and conventions where `last-verified` is older than N days (configurable in PROTOCOL.md)
2. **Broken links** — `superseded-by` or `[[wikilinks]]` pointing to a file that doesn't exist
3. **Missing attribution** — records without `decided-by`
4. **Orphaned profiles** — people profiles where `email` doesn't match any recent git author
5. **Empty templates** — files that are still just the `_template.md` content, never filled in

## Verb definitions

Each verb maps 1:1 to a skill file in `skills/`. The agent discovers verbs by reading skill frontmatter (`name` + `description`). No separate VERBS.md index — single source of truth in `skills/`.

## Phases

### Phase 1 — Protocol scaffold
- [x] Define PROTOCOL.md with v0.1 frontmatter
- [x] Define AGENTS.md (Codex entrypoint shim)
- [x] Define verb set (verbs derived from skills/ frontmatter, no separate VERBS.md)
- [x] Define directory structure and frontmatter conventions
- [x] Write harness shim files (CLAUDE.md, AGENTS.md, .github/copilot-instructions.md)
- [x] Write skill files (hello, status, onboard, decide, handoff, lint, search)
- [x] Create `_template.md` files for records, people, conventions
- [x] Create template synesis.code-workspace file
- [x] Create attachments/ and tools/ directories with README
- [x] Write README.md (the only branded file)

### Phase 2 — Dogfood
- [x] Fork to steve-krisjanovs/synesis (private)
- [x] Populate with real team knowledge (conventions, people, architecture)
- [x] Test with Claude Code (hello, lint, decide verbs — 6 bugs found and fixed)
- [x] Test multi-root workspace scope boundary (convention bleed test passed)
- [x] Iterate on protocol based on real usage (tag-based scoping, scope boundary, librarian absorption)
- [ ] Test with Codex and Copilot harnesses

### Phase 3 — Polish
- [ ] Lint verb implementation (agent-native, no shell scripts)
- [ ] Onboarding flow testing with a real new developer
- [ ] Documentation site (if warranted)

### Phase 4 — Public launch
- [x] Final naming decision — **Synesis**
- [x] README, examples, getting-started guide
- [ ] Announce

---

*Filed: 2026-08-22*
*Updated: 2026-08-22*
*Name: Synesis*
*Status: Phase 2 dogfooding complete, Phase 3 next*
