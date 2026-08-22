# Hivemind — Execution Plan

> **Codename:** Hivemind (working title — brand-neutral internals, rename costs nothing)
> **Repo:** cordfuse/hivemind (public)
> **What it is:** A file-based, repo-embedded, agent-agnostic shared knowledge protocol for software teams.
> **What it is not:** A SaaS product, an MCP server, an npm package, a database.

---

## The gap

Every AI coding agent (Claude Code, Copilot, Cursor, Gemini, OpenCode) can read markdown files in a repo. None of them ship a convention for **shared team knowledge** — the kind that survives developer turnover, lives next to the code, and works regardless of which agent a developer uses.

Cortex proved the pattern for one person. Hivemind is cortex for teams.

## Design principles

1. **Files, not services.** Markdown in a repo. No server, no database, no API keys. Clone and go.
2. **Agent-agnostic.** Works with any AI harness that reads project files. No vendor lock-in.
3. **Brand-neutral internals.** `PROTOCOL.md`, not `HIVEMIND.md`. The brand lives in the README and docs, never in the protocol files themselves. Zero rename cost.
4. **Trust the team.** No review gates on knowledge contributions. Anyone can commit. Git history is the audit trail. Friction kills adoption.
5. **Framework/custom split.** Framework = the protocol (shared, versioned, upstream-synced). Custom = team-specific knowledge (decisions, people, conventions).

## Architecture

```
repo/
  .hivemind/                    # or whatever the install dir is — TBD
    PROTOCOL.md                 # teaches any agent the conventions (like CORTEX.md)
    AGENTS.md                   # agent-facing instructions (capabilities, rules)
    VERBS.md                    # team workflows (hello, status, sync, onboard)
    records/                    # institutional memory
      2026-08-18-auth-decision.md
      2026-08-20-api-redesign.md
    people/                     # team context
      sarah.md                  # role, expertise, owns auth layer
      mike.md                   # role, expertise, owns frontend
    conventions/                # how we do things here
      git.md                    # branching, commit style, PR process
      architecture.md           # system overview, key decisions
      onboarding.md             # new dev reads this on day 1
```

## What carries over from cortex

| Cortex concept | Hivemind equivalent | Changes |
|---|---|---|
| CORTEX.md | PROTOCOL.md | Brand-neutral name |
| Records | records/ | Add attribution (who wrote it, when) |
| Verbs (hello, goodbye, sync) | VERBS.md | Add team verbs: `onboard`, `handoff`, `decide` |
| Framework/custom split | Same pattern | Framework = hivemind upstream, custom = team overrides |
| Actor profiles | Dropped | Single voice per team, not personalities |
| Personal daily journal | Dropped | Not relevant at team level |

## New features (not in cortex)

### 1. People directory
`people/` folder with one markdown per team member. Role, expertise areas, what they own. Agents use this to answer "who should I ask about X?" and to attribute context correctly.

### 2. Onboarding mode
New dev clones repo, runs `hello` (or their agent reads PROTOCOL.md on first open). The protocol catches them up: architecture overview, active work, team conventions, who owns what.

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

### 5. Cross-repo awareness
A central hivemind repo that satellite project repos can reference. Satellite repos carry a pointer file (`HIVEMIND.md` or `.hivemind/upstream.md`) that tells agents where to find the team brain.

### 6. Conventions as code
`conventions/` folder replaces tribal knowledge. Git branching strategy, commit message format, deployment process, coding standards — all in markdown, all agent-readable. New devs and new agents get the same briefing.

### 7. Contribution workflow
No PR gate. Commit directly to the hivemind. Trust the team. Git blame + git log = full audit trail. A `lint` verb handles hygiene (staleness, orphaned refs, missing attribution).

## Verb definitions (initial set)

| Verb | What it does |
|---|---|
| `hello` | Briefing: active work, recent decisions, team status |
| `status` | What's in flight, who's working on what |
| `onboard` | Full catch-up for a new team member |
| `decide` | File a decision record (prompted template) |
| `handoff` | Transfer ownership/context on a piece of work |
| `lint` | Check freshness, orphaned refs, missing attribution |
| `search` | Find knowledge across records and conventions |

## Phases

### Phase 1 — Protocol scaffold
- [ ] Define PROTOCOL.md (the core teaching document)
- [ ] Define AGENTS.md (agent-facing instructions)
- [ ] Define VERBS.md with initial verb set
- [ ] Define directory structure and file conventions
- [ ] Write README.md (the only branded file)
- [ ] Create example records, people, conventions

### Phase 2 — Dogfood with Innovia
- [ ] Install hivemind in one Innovia repo
- [ ] Populate with real team knowledge (conventions, people, architecture)
- [ ] Test with multiple agents (Claude Code + Copilot minimum)
- [ ] Iterate on protocol based on real usage

### Phase 3 — Cross-repo and polish
- [ ] Design and test the satellite repo pointer pattern
- [ ] Lint verb implementation (shell script or agent-native)
- [ ] Onboarding flow testing with a real new developer
- [ ] Documentation site (if warranted)

### Phase 4 — Public launch
- [ ] Final naming decision
- [ ] README, examples, getting-started guide
- [ ] Announce

## Open questions

1. **Install directory name:** `.hivemind/` at repo root? Or top-level `hivemind/`? Dot-prefix hides it from casual browsing but some teams want visibility.
2. **People directory privacy:** Some teams won't want individual profiles in a public repo. Optional? Gitignored? Separate private repo?
3. **Versioning:** Should the protocol carry a version number (like cortex does)? Useful for upstream sync but adds overhead.
4. **Satellite pointer format:** How does a project repo reference the central hivemind? Symlinks break on Windows. Git submodules are painful. Simple URL pointer in a markdown file?

---

*Filed: 2026-08-22*
*Codename: Hivemind*
*Status: Planning*
