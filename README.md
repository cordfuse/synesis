# Synesis

**Shared team knowledge for AI coding agents.**

Synesis (Greek: σύνεσις — *understanding, the faculty of putting things together*) is a file-based, repo-embedded, agent-agnostic shared knowledge protocol for software teams.

---

## The problem

Your team makes decisions every week. Conventions exist as tribal knowledge. New developers ask the same questions. AI coding agents start every session with zero context about how your team works.

Documentation wikis go stale. Onboarding docs drift from reality. The knowledge that matters most — *why* things are the way they are — lives in people's heads and gets lost when they leave.

## The solution

Markdown files in a git repo. No server, no database, no API keys, no SaaS. Clone and go.

Synesis gives your team a shared vault of decisions, conventions, people profiles, and institutional memory. Every AI coding agent that can read a file inherits your team's knowledge automatically — who owns what, how you do things, what was already decided and why.

## What it is not

- Not a SaaS product — it's files in your repo
- Not an MCP server — no runtime, no process
- Not an npm package — nothing to install
- Not a database — git is the database

## Quick start

1. Click **"Use this template"** to create your team's vault
2. Clone it locally
3. Open it in your AI coding agent (Claude Code, Codex, Copilot — all supported)
4. Say `hello` — the agent reads the protocol and offers to onboard you

That's it. The agent now knows the protocol. As you add people, decisions, and conventions, every agent session inherits that knowledge.

## What lives in the vault

```
synesis/
  PROTOCOL.md              # the protocol — teaches any agent the conventions
  AGENTS.md                # agent instructions (also Codex entrypoint)
  VERBS.md                 # commands the agent understands
  skills/                  # agent capabilities (onboard, decide, lint, etc.)
  records/                 # decisions and institutional memory
  people/                  # one profile per team member
  conventions/             # how your team does things
  attachments/             # binary files linked to records
  tools/                   # team-shared scripts
```

### Records

Decisions, ADRs, and anything the team agreed on. Each record captures *what* was decided, *why*, *who* decided, and *who* was consulted. Records can be marked `superseded` and linked to their replacement.

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

### People

One markdown file per team member. Role, expertise, ownership areas. The agent uses these to answer "who should I ask about X?" and to detect new team members automatically via `git config user.email`.

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

### Conventions

Your team's standards as markdown files. Git branching strategy, commit message format, coding standards, deployment process — all in one place, readable by both humans and agents. New devs and new agents get the same briefing.

```yaml
---
name: Git branching strategy
last-verified: 2026-08-18
tags: [git, workflow]
---
```

## Supported harnesses

Synesis works with any AI coding agent that can read project files. It ships one-line shim files for three harnesses out of the box:

| Harness | Mode | Shim file |
|---|---|---|
| Claude Code | CLI + VS Code | `CLAUDE.md` |
| OpenAI Codex | CLI + VS Code | `AGENTS.md` |
| GitHub Copilot | CLI + VS Code | `.github/copilot-instructions.md` |

Each shim redirects the agent into `PROTOCOL.md`, where the actual protocol lives. Adding support for a new harness = adding a one-line shim file. The knowledge stays in one place.

## Verbs

Verbs are commands you give to the agent. The agent reads `VERBS.md` to know what's available.

| Verb | What it does |
|---|---|
| `hello` | Team briefing — active work, recent decisions, team status |
| `onboard` | New member setup — interview, profile creation, full briefing |
| `decide` | File a decision record with attribution and context |
| `handoff` | Transfer ownership and context on a piece of work |
| `lint` | Check vault hygiene — stale records, broken links, missing attribution |
| `search` | Find knowledge across records, conventions, and people |

## Skills

Skills are agent capabilities defined as markdown files in `skills/`. Each skill specifies its triggers and step-by-step instructions. The agent reads them to know what it can do and when to activate.

Included skills: `onboard`, `decide`, `handoff`, `lint`, `search`.

## VS Code multi-root workspace

For VS Code users, open your Synesis vault alongside your project repos in a multi-root workspace:

```json
{
  "folders": [
    { "path": "../synesis" },
    { "path": "../my-project" },
    { "path": "../another-project" }
  ]
}
```

The agent sees both your code and your team knowledge. When it needs context — conventions, ownership, past decisions — the vault is right there in the workspace.

All three supported harnesses (Claude Code, Codex, Copilot) auto-discover their shim files from workspace folders. A template `.code-workspace` file is included.

## Onboarding

When a new developer clones the vault and says `hello`, the agent:

1. Reads `git config user.email` and checks `people/` for a match
2. If no match — runs the onboard skill: a lightweight interview (name, initials, role, areas of work)
3. Creates their profile in `people/`, commits and pushes it
4. Delivers a full team briefing: conventions, recent decisions, who owns what

The next time they say `hello`, they skip straight to the briefing. No setup docs to read. No Confluence pages to find.

## Knowledge freshness

Records and conventions carry a `last-verified` date. The `lint` skill flags anything older than the configurable threshold (default: 90 days). No automated deletion — just visibility. The team decides what to update, verify, or supersede.

## Obsidian-compatible

The vault doubles as an Obsidian vault. `[[wikilinks]]` for internal cross-references, `aliases` and `tags` in frontmatter for filtering and linking. `.obsidian/` is gitignored so each user keeps their own Obsidian config.

## Design principles

1. **Files, not services.** Markdown in a repo. No server, no runtime, no API keys.
2. **Agent-agnostic.** Works with any harness that reads project files. No vendor lock-in.
3. **Brand-neutral internals.** `PROTOCOL.md`, not `SYNESIS.md`. The brand lives here in the README, never in the protocol files.
4. **Trust the team.** No PR gates. Anyone can commit. Git history is the audit trail.
5. **Fork and own.** Use the template, make it yours. The protocol defines the structure; your team fills it with real knowledge.
6. **Obsidian-compatible.** Wikilinks, tags, aliases — the vault works in Obsidian out of the box.

## Contributing

No PR gate on your team vault. Commit directly. Trust the team. `git blame` + `git log` = full audit trail. The `lint` skill handles hygiene.

For contributions to the Synesis protocol itself (this template repo), PRs welcome.

## License

MIT
