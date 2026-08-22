# Hivemind — Execution Plan

> **Codename:** Hivemind (working title — brand-neutral internals, rename costs nothing)
> **Repo:** cordfuse/hivemind (public) — the framework/template
> **Dogfood:** steve-krisjanovs/hivemind (private) — real team knowledge, dogfooding
> **What it is:** A file-based, repo-embedded, agent-agnostic shared knowledge protocol for software teams.
> **What it is not:** A SaaS product, an MCP server, an npm package, a database.

---

## The gap

Every AI coding agent (Claude Code, Codex, Copilot, and others) can read markdown files in a repo. None of them ship a convention for **shared team knowledge** — the kind that survives developer turnover, lives next to the code, and works regardless of which agent a developer uses.

Cortex proved the pattern for one person. Hivemind is cortex for teams.

## Design principles

1. **Files, not services.** Markdown in a repo. No server, no database, no API keys. Clone and go.
2. **Agent-agnostic.** Works with any AI harness that reads project files. No vendor lock-in.
3. **Brand-neutral internals.** `PROTOCOL.md`, not `HIVEMIND.md`. The brand lives in the README and docs, never in the protocol files themselves. Zero rename cost.
4. **Trust the team.** No review gates on knowledge contributions. Anyone can commit. Git history is the audit trail. Friction kills adoption.
5. **Framework/custom split.** Framework = the protocol (shared, versioned, upstream-synced). Custom = team-specific knowledge (decisions, people, conventions).

## Repo model

- **`cordfuse/hivemind`** (public) — the framework/template. Protocol docs, example files, README. Teams fork this.
- **`steve-krisjanovs/hivemind`** (private) — Steve's fork. Real people, real decisions, real conventions. Dogfood repo for Innovia.

Same pattern as cortex: `cordfuse/cortex` = framework, `steve-krisjanovs/cortex` = personal instance.

## Architecture

```
hivemind/
  PROTOCOL.md                 # teaches any agent the conventions — carries version in frontmatter
  AGENTS.md                   # agent-facing instructions (capabilities, rules)
  VERBS.md                    # team workflows (hello, status, sync, onboard)
  records/                    # institutional memory
    2026-08-18-auth-decision.md
    2026-08-20-api-redesign.md
  people/                     # team context (private forks only — templates in public repo)
    _template.md              # example format (public repo)
    sarah.md                  # role, expertise, owns auth layer (private fork)
    mike.md                   # role, expertise, owns frontend (private fork)
  conventions/                # how we do things here
    git.md                    # branching, commit style, PR process
    architecture.md           # system overview, key decisions
    onboarding.md             # new dev reads this on day 1
  CLAUDE.md                   # shim: "Read and follow PROTOCOL.md" (Claude Code CLI + VS Code)
  AGENTS.md                   # doubles as Codex CLI entrypoint
  .github/
    copilot-instructions.md   # shim: "Read and follow PROTOCOL.md" (GitHub Copilot)
  README.md                   # the only branded file
```

Top-level layout, no dot-prefix. This is a cloned repo, not a config directory nested inside another project.

## Harness shims

Each AI harness has its own entrypoint file. Hivemind ships a one-line shim for each supported harness that redirects into `PROTOCOL.md`:

| Harness | Mode | Shim file | Content |
|---|---|---|---|
| Claude Code | CLI + VS Code | `CLAUDE.md` | Read and follow PROTOCOL.md |
| OpenAI Codex | CLI + VS Code | `AGENTS.md` | Already the agent-facing instructions file — Codex reads it natively |
| GitHub Copilot | CLI + VS Code | `.github/copilot-instructions.md` | Read and follow PROTOCOL.md |

All three harnesses have both CLI and VS Code extensions. Three harnesses supported at launch. Adding a new harness = adding a one-line shim file. The actual knowledge stays in one place.

## VS Code multi-root workspace

Developers using VS Code-based harnesses (Claude Code, Codex, Copilot — all have VS Code extensions) work in a **multi-root workspace** that includes hivemind alongside their project repos:

```json
{
  "folders": [
    { "path": "../hivemind" },
    { "path": "../my-al-project" },
    { "path": "../another-al-project" }
  ]
}
```

All three harnesses auto-discover their shim files from workspace folders in multi-root workspaces. Copilot had a bug with this ([vscode#264837](https://github.com/microsoft/vscode/issues/264837)) but it was fixed in September 2025.

The agent sees both hivemind and the project. When working in the project and needing team context — conventions, ownership, past decisions — hivemind is right there in the workspace.

The public framework ships a template `.code-workspace` file. Teams customize it with their own project paths.

Terminal users (Claude Code, OpenCode, etc.) open a separate session on the hivemind repo as needed.

### Multi-root risks

| Risk | Mitigation |
|---|---|
| Conflicting agent instructions (both repos have CLAUDE.md) | Documented precedence rule: project repo overrides hivemind on conflicts |
| Accidental cross-repo commits | Git catches this (different working trees) — document the foot-gun |
| Context window bloat | Keep hivemind lean; agents index both repos |
| Copilot code suggestions polluted by prose | Minor — monitor during dogfooding |
| ~~Copilot ignores `.github/` in multi-root workspaces~~ | Fixed Sep 2025 ([vscode#264837](https://github.com/microsoft/vscode/issues/264837)). No workaround needed |

## Versioning

Major.minor in `PROTOCOL.md` frontmatter, starting at **v0.1**.

- **Minor bump:** add/change a convention, new verb, new template
- **Major bump:** breaking change to directory structure or PROTOCOL.md format

Private forks track upstream version: `upstream: cordfuse/hivemind@v0.1` in their PROTOCOL.md frontmatter.

## What carries over from cortex

| Cortex concept | Hivemind equivalent | Changes |
|---|---|---|
| CORTEX.md | PROTOCOL.md | Brand-neutral name, versioned |
| Records | records/ | Add attribution (who wrote it, when) |
| Verbs (hello, goodbye, sync) | VERBS.md | Add team verbs: `onboard`, `handoff`, `decide` |
| Framework/custom split | Same pattern | Framework = hivemind upstream, custom = team overrides |
| Actor profiles | Dropped | Single voice per team, not personalities |
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

### 3. Decision log with attribution
Records include who decided, who was consulted, and why. Prevents relitigating settled decisions. Template:
```markdown
## Decision: [title]
- **Date:** 2026-08-18
- **Decided by:** Sarah, Mike
- **Context:** [why this came up]
- **Decision:** [what was decided]
- **Alternatives considered:** [what was rejected and why]
```

### 4. Knowledge freshness
Each record carries a `last-verified` date in frontmatter. A `lint` verb flags records older than N days (configurable) as stale. No automated deletion — just visibility.

### 5. Conventions as code
`conventions/` folder replaces tribal knowledge. Git branching strategy, commit message format, deployment process, coding standards — all in markdown, all agent-readable. New devs and new agents get the same briefing.

### 6. Contribution workflow
No PR gate. Commit directly to the hivemind. Trust the team. Git blame + git log = full audit trail. A `lint` verb handles hygiene (staleness, orphaned refs, missing attribution).

## Verb definitions (initial set)

| Verb | What it does |
|---|---|
| `hello` | Briefing: active work, recent decisions, team status |
| `status` | What's in flight, who's working on what |
| `onboard` | Re-run onboarding (interview + briefing). Automatic on first `hello` when no profile exists; manual trigger for profile updates or re-briefing |
| `decide` | File a decision record (prompted template) |
| `handoff` | Transfer ownership/context on a piece of work |
| `lint` | Check freshness, orphaned refs, missing attribution |
| `search` | Find knowledge across records and conventions |

## Phases

### Phase 1 — Protocol scaffold
- [ ] Define PROTOCOL.md with v0.1 frontmatter
- [ ] Define AGENTS.md (agent-facing instructions)
- [ ] Define VERBS.md with initial verb set
- [ ] Define directory structure and file conventions
- [ ] Write harness shim files (CLAUDE.md, AGENTS.md, .github/copilot-instructions.md)
- [ ] Create template .code-workspace file
- [ ] Create example records, people templates, conventions
- [ ] Write README.md (the only branded file)

### Phase 2 — Dogfood with Innovia
- [ ] Fork to steve-krisjanovs/hivemind (private)
- [ ] Populate with real team knowledge (conventions, people, architecture)
- [ ] Test with multiple agents (Claude Code + Copilot minimum)
- [ ] Test multi-root workspace flow in VS Code
- [ ] Iterate on protocol based on real usage

### Phase 3 — Polish
- [ ] Lint verb implementation (agent-native, no shell scripts)
- [ ] Onboarding flow testing with a real new developer
- [ ] Documentation site (if warranted)

### Phase 4 — Public launch
- [ ] Final naming decision
- [ ] README, examples, getting-started guide
- [ ] Announce

---

*Filed: 2026-08-22*
*Updated: 2026-08-22*
*Codename: Hivemind*
*Status: Planning*
