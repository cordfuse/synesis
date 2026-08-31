# Synesis

**Shared team knowledge for AI coding agents.**

Synesis (Greek: σύνεσις — *understanding, the faculty of putting things together*) is a file-based, repo-embedded, agent-agnostic shared knowledge protocol for software teams.

> **Protocol source:** [cordfuse/synesis](https://github.com/cordfuse/synesis)
> Your vault records the protocol it holds in `PROTOCOL.md` frontmatter (`version:`), and which repo it came from in the same place (`upstream:` — the repo alone, no version). `hello` compares that version against the newest upstream tag and mentions it in one line when something newer exists — say `reconcile` to review the changes. Reconcile diffs the protocol files only, and never touches your records, conventions, people or licence.

---

## Why this exists

AI coding agents are becoming essential infrastructure, but every vendor wants to own your team's knowledge. Claude has its memory system. Copilot has its knowledge bases. Each one locks your conventions, decisions, and institutional memory inside a proprietary format that only works with that vendor's tools.

Switch agents and you start from zero. Run multiple agents and you maintain parallel knowledge stores. Your team's understanding of itself becomes a vendor dependency.

Synesis exists to prevent that. Plain markdown in a git repo. Any agent that can read a file — Claude Code, Codex, Copilot, Gemini, or whatever ships next quarter — inherits your team's knowledge automatically. No migration, no export, no lock-in.

## The problem it solves

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

1. Click **"Use this template"** to create your team's vault — the button only appears when you're signed in to GitHub
2. Clone it locally
3. Open it in your AI coding agent (Claude Code, Codex, Copilot, Antigravity, OpenCode — all supported)
4. Say `hello` — the agent reads the protocol and offers to onboard you

That's it. The agent now knows the protocol. As you add people, decisions, and conventions, every agent session inherits that knowledge.

Not sure what that looks like in practice? [EXAMPLE.md](EXAMPLE.md) walks through a vault's first week.

## What lives in the vault

```
synesis/
  PROTOCOL.md              # the protocol — teaches any agent the conventions
  EXAMPLE.md               # walkthrough of a vault's first week (delete once you have your own)
  CLAUDE.md                # Claude Code shim → PROTOCOL.md
  AGENTS.md                # Codex shim → PROTOCOL.md
  GEMINI.md                # Gemini / Antigravity shim → PROTOCOL.md
  opencode.json            # OpenCode shim → PROTOCOL.md
  .github/
    copilot-instructions.md  # Copilot shim → PROTOCOL.md
  skills/                  # agent capabilities (onboard, decide, lint, etc.)
  records/                 # decisions and institutional memory
  people/                  # one profile per team member
  conventions/             # how your team does things
  attachments/             # binary files linked to records
  tools/                   # team-shared scripts
  synesis.code-workspace   # template multi-root workspace
  .gitignore               # ignores .obsidian/ (per-user config)
```

### Records

Decisions, ADRs, and anything the team agreed on — *what* was decided, *why*, *who* decided, and *who* was consulted.

Records come in two kinds. A **decision** is what the team chose; a **note** is what the team found — a postmortem, a benchmark, a research result, the conclusion of a long debugging session. Notes carry no attribution, because nobody decided anything, and `lint` does not ask them for any. A record with no `type` is a decision, so the common case stays unannotated.

A decision moves through the ADR lifecycle: **proposed → accepted**, or **proposed → rejected**. `propose` opens the question while the options are still live; `decide` writes the answer into that same record either way. A rejection is a decision and stays visible — its whole value is stopping the same idea returning in six months.

`status` records only *what was decided*. Whether a record is still current is a separate question, answered by `superseded-by` alone. Once answered a record is **append-only** — to change the decision you file a new one and point the old at it, leaving its `status` as it was. Both stay, and the chain is the history. That separation is what lets a rejection later reversed stay `rejected` and gain a pointer.

### People

One markdown file per team member — role, expertise, ownership. The agent uses these to answer "who should I ask about X?" and to spot new team members automatically via `git config user.email`.

### Conventions

Your team's standards as files. Branching strategy, commit format, deployment process — read by every agent, in every session, before it touches anything. Conventions are living documents, so anything that gets edited forever lives here: a standard, an index, a running catalogue. Records are snapshots; conventions are current state.

---

## See it working

**[EXAMPLE.md](EXAMPLE.md) walks through a vault's first week** — two developers, one agent, from empty repo to a linked graph of decisions. Real file contents, real agent output, every verb in the order you'd actually hit it.

Start there if you'd rather see the loop than read the spec.

## Supported harnesses

Synesis works with any AI coding agent that can read project files. It ships one-line shim files for five harnesses out of the box:

| Harness | Mode | Shim file |
|---|---|---|
| Claude Code | CLI + VS Code | `CLAUDE.md` |
| OpenAI Codex | CLI + VS Code | `AGENTS.md` |
| GitHub Copilot | CLI + VS Code | `.github/copilot-instructions.md` |
| Gemini / Antigravity | CLI | `GEMINI.md` |
| OpenCode | CLI | `opencode.json` |

Each shim redirects the agent into `PROTOCOL.md`, where the actual protocol lives. Adding support for a new harness = adding a one-line shim file. The knowledge stays in one place.

## Verbs and skills

Verbs are commands you give to the agent. Each verb maps to a skill file in `skills/`. The agent reads skill frontmatter to discover what's available — no separate verb index to maintain.

Skills are markdown files that define triggers and step-by-step instructions. See `skills/` for the full set.

A few worth knowing about up front:

- **`note`** — records what the team learned when nothing was decided. Without it, findings get forced through the decision template and end up claiming someone chose something.
- **`propose`** — files the *question* rather than the answer, so the reasoning is captured while options are still on the table. Without it a decision only enters the vault once someone remembers to record it, reconstructed from memory. `hello` and `status` lead with whatever is still open.
- **`weave`** — cross-links related records and conventions so the flat vault becomes a navigable graph
- **`wire`** — prints the exact config that makes the vault visible to agents in sessions started outside its folder, filled in with the real path and only for the harnesses you actually have installed. It never writes to your machine; setup files load in every project, so applying them stays your call.
- **`reconcile`** — diffs your vault's protocol files against this template and surfaces what drifted, one file at a time. Vaults are created with "Use this template", so there is no fork relationship and nothing to merge; reconcile is a file-level diff, never a history operation. Your own records and conventions are never in scope — only the protocol files you inherited.

## Using with your projects

Synesis lives in its own repo. Your project repos are separate. The agent needs to see both — your code and your team knowledge. Two approaches, depending on your editor.

### VS Code — multi-root workspace

Open your vault alongside your project repos in a multi-root workspace:

```json
{
  "folders": [
    { "path": "../synesis" },
    { "path": "../my-project" },
    { "path": "../another-project" }
  ]
}
```

All harnesses except OpenCode auto-discover their shim files from workspace folders. OpenCode uses `opencode.json` in the vault root. A template `.code-workspace` file is included.

### CLI — cross-repo setup (one-time)

Each harness has a user-level config mechanism that loads in every session, regardless of which repo you open. Point it to your vault and every project inherits team knowledge automatically.

Run `wire` in the vault to have these snippets printed with your real path already filled in, for the harnesses you actually have installed. It shows what to paste; it never writes to your machine.

#### Claude Code and Antigravity

Both use a global instruction file that loads in every session. Point it at the vault:

| Harness | Global config file |
|---|---|
| Claude Code | `~/.claude/CLAUDE.md` |
| Antigravity | `~/.gemini/GEMINI.md` |

```
Read and follow PROTOCOL.md in the team's knowledge vault at /absolute/path/to/your-vault

When the user says "hello", run the hello skill from that vault's skills/ directory.
Read the matching skills/<verb>.md before acting on any other verb.
```

Use the vault's **absolute** path, not `~/…` — the config files below are JSON and do not expand a tilde.

**The instruction file makes the vault discoverable. It does not make it readable.** Both harnesses need a second, separate grant, and without it the failure is silent: the session loads the path, every read is refused, and it answers as though no vault existed.

For Claude Code, add the vault to `permissions.additionalDirectories` in `~/.claude/settings.json` — merge, never overwrite:

```json
{
  "permissions": {
    "additionalDirectories": ["/absolute/path/to/your-vault"]
  }
}
```

For Antigravity, add it to `trustedWorkspaces` in `~/.gemini/antigravity-cli/settings.json`:

```json
{
  "trustedWorkspaces": ["/absolute/path/to/your-vault"]
}
```

Note the path — Antigravity's settings live under `antigravity-cli/`. `~/.gemini/settings.json` is Gemini CLI's file and is not the same thing.

#### Codex CLI and Copilot CLI

Both use a personal skill for instruction discovery. Their file-access needs differ.

**1. Personal skill** — create a `SKILL.md` in the harness's personal skills directory. Substitute your vault's folder name for `<vault-name>`:

| Harness | Skill file path |
|---|---|
| Codex CLI | `~/.codex/skills/<vault-name>/SKILL.md` |
| Copilot CLI | `~/.copilot/skills/<vault-name>/SKILL.md` |

```markdown
---
name: <vault-name>
description: Team knowledge protocol — always active. Handles hello, status, catchup, propose, decide, note, convention, lint, search, sync, reconcile, archive, update, onboard, handoff, weave, wire verbs.
alwaysApply: true
---

At the start of every session, read and follow PROTOCOL.md in the team's knowledge vault at /absolute/path/to/your-vault

When the user says "hello", run the hello skill from that vault's skills/ directory.
Read the matching skills/<verb>.md before acting on any other verb.
```

**2. File access.**

**Codex needs none** — it reads outside its working directory by default.

**Copilot needs `--add-dir` at launch, and no config key substitutes.** `trustedFolders` in `~/.copilot/config.json` is documented as "folders where permission to read or execute files has been granted" and does **not** govern path reads — tested 2026-08-31 with the vault's parent listed there, and the read was refused; the same read succeeded immediately under `--add-dir`.

```
copilot --add-dir "/absolute/path/to/your-vault"
```

To avoid typing it every session, record the approval per location in `~/.copilot/permissions-config.json` instead — `wire` prints the full block, scoped to the vault and nowhere else. Do not wrap the `copilot` command in a shell alias: it redefines the CLI for every repo you open, and the same workaround would then be owed to every other harness.

**3. Codex also needs the vault trusted** — a separate thing from file access, and easy to miss. Codex reads a project-local `.codex/config.toml` *only* for projects it trusts, so an untrusted vault has its own shipped settings silently ignored and prompts on every command. Add to `~/.codex/config.toml`, path lowercased:

```toml
[projects."/absolute/path/to/your-vault"]
trust_level = "trusted"
```

Optionally for Copilot, `--allow-tool 'shell(git:*)'` at launch. That is the whole shell grant the protocol needs, since vault shell use is restricted to git. Without it every git call in `hello` asks for approval separately and the briefing turns into a consent form. It grants a tool rather than a path, which is why it stays a flag.

#### OpenCode

OpenCode uses a global skill for instruction discovery plus a `references` entry for file access.

**1. Global skill** — create a `SKILL.md` in OpenCode's global skills directory:
| Path |
|---|
| `~/.config/opencode/skills/<vault-name>/SKILL.md` |

```markdown
---
name: <vault-name>
description: Team knowledge protocol — always active. Handles hello, status, catchup, propose, decide, note, convention, lint, search, sync, reconcile, archive, update, onboard, handoff, weave, wire verbs.
---

At the start of every session, read and follow PROTOCOL.md in the team's knowledge vault at /absolute/path/to/your-vault

When the user says "hello", run the hello skill from that vault's skills/ directory.
Read the matching skills/<verb>.md before acting on any other verb.
```

**2. Reference** — add a `references` entry in your global config (`~/.config/opencode/opencode.json`):

```json
{
  "references": {
    "<vault-name>": {
      "path": "/absolute/path/to/your-vault",
      "description": "Team knowledge vault — conventions, decisions, people profiles. Read PROTOCOL.md for the protocol."
    }
  }
}
```

The global skill tells the agent what to do; the `references` entry gives it permission to read the vault files. Both are needed.

> **File access is a config key, not a launch flag.** Every harness above has a durable setting for it, so none of this needs a shell alias or wrapper. `--add-dir` still works for a one-off session against a vault you are not wiring, but it is forgotten at the next launch and is not wiring.

> **Verification status, 2026-08-31.** Wiring is the part of this vault that has needed the most correction, so it is worth saying plainly which harnesses have been exercised and which have only been read from config:
>
> | Harness | Cross-repo access | Status |
> |---|---|---|
> | Claude Code | `permissions.additionalDirectories` | **verified** |
> | Codex CLI | none needed | **verified** — `codex exec` from `/tmp` read a vault elsewhere on disk |
> | Copilot CLI | `--add-dir`, or `permissions-config.json` | **verified** — and `trustedFolders` disproved |
> | Antigravity | `trustedWorkspaces` | untested — config read, never exercised |
> | OpenCode | `references` | untested — config read, never exercised |
>
> The two untested rows are the same kind of evidence that produced the `trustedFolders` error: vendor wording plus a setup that appeared to work. Treat them as probable, not established.

### Scope boundary

Vault conventions apply to the vault only. In a multi-root workspace or with global config, project repos keep their own rules. The agent never applies vault conventions (branching, commit style, merge strategy) to a project repo unless that project's own instructions say to.

## Onboarding

When a new developer clones the vault and says `hello`, the agent:

1. Reads `git config user.email` and checks `people/` for a match
2. If no match — runs the onboard skill: a lightweight interview (name, initials, role, areas of work)
3. Creates their profile in `people/`, commits and pushes it
4. Delivers a full team briefing: conventions, recent decisions, who owns what

The next time they say `hello`, they skip straight to the briefing. No setup docs to read. No Confluence pages to find.

## Knowledge freshness

Records and conventions carry a `last-verified` date. The `lint` skill flags anything older than the configurable threshold (default: 90 days). No automated deletion — just visibility. The team decides what to update, verify, or supersede.

Knowledge that is no longer current gets `archive`d rather than deleted: it drops out of briefings and lint, stays findable by `search`, and `weave` stops linking to it so the graph doesn't lead anywhere dead. Nothing leaves the vault, and `git log` keeps the rest.

## Catching up

`catchup` answers "what changed while I was away?" — new decisions, changed conventions, people added, skills modified — by diffing git history against the `last-seen` date in your profile.

That field belongs to `catchup` alone. `hello` deliberately does not touch it: a greeting that stamped today's date would erase the very baseline catchup needs, and you would be told nothing had changed no matter how long you had been gone.

## Obsidian-compatible

The vault doubles as an Obsidian vault. `[[wikilinks]]` for internal cross-references, `aliases` and `tags` in frontmatter for filtering and linking. `.obsidian/` is gitignored so each user keeps their own Obsidian config.

The `weave` verb is what fills the graph view. It backfills cross-links across your records and conventions, collecting them in a derived `## Related` block at the end of each file — generated, never hand-written, and safe to delete and rebuild. Links are conservative: a real relationship, not topical adjacency.

Weave is idempotent: run it twice and the second run changes nothing. Links that already exist keep the wording they already had, so a weave pass only ever touches files whose relationships actually changed. Your diffs stay readable.

## Design principles

1. **Files, not services.** Markdown in a repo. No server, no runtime, no API keys.
2. **Agent-agnostic.** Works with any harness that reads project files. No vendor lock-in. Verified end to end on Claude Code, Codex CLI and Copilot CLI; Antigravity and OpenCode are wired from config but untested — see the verification table above.
3. **Brand-neutral internals.** `PROTOCOL.md`, not `SYNESIS.md`. The brand lives here in the README, never in the protocol files.
4. **Trust the team.** No PR gates. Anyone can commit. Git history is the audit trail.
5. **Use the template and own it.** Make it yours — there is no fork relationship, and upstream changes arrive through `reconcile`, gated per file. The protocol defines the structure; your team fills it with real knowledge.
6. **Obsidian-compatible.** Wikilinks, tags, aliases — the vault works in Obsidian out of the box.

## Permissions

The vault ships `.claude/settings.json` with a deliberately small grant: `Bash(git:*)`, plus the file tools. Every skill shells out to git and nothing else, so nothing wider is needed.

That matters more here than in an ordinary repo. `reconcile` pulls protocol files from the template, so a third party writes the instructions your agent then follows — the ordinary exposure of any dependency, no hostile maintainer required. A blanket shell grant is the wrong default to pair with it. `git config --global` and `git push --force` are denied outright: one writes machine state from a repo-scoped skill, the other can destroy history that is your team's only copy of its decisions.

This shrinks the target rather than closing it — `git -c` reaches outside git by design. The point is that the grant is now a decision rather than an inheritance, and widening it has to be argued for.

The files that steer the agent are denied to `Edit`: the harness shims (`CLAUDE.md`, `GEMINI.md`, `opencode.json`, the Copilot instructions) and `.claude/settings.json` itself. An agent that can rewrite its own instructions, or widen its own permissions, is not meaningfully constrained by either. `LICENSE`, `README.md` and `PLAN.md` are denied too — they are the template's or the team's, not the agent's to edit.

`PROTOCOL.md`, `AGENTS.md` and `skills/**` are deliberately **not** denied, even though they are protocol rather than team content. `reconcile` has to write them to pull an update, and a deny there turns every protocol bump into a permissions detour. If your team wants the stronger guard, add them — just expect to lift them each time you reconcile.

## Contributing

No PR gate on your team vault. Commit directly. Trust the team. `git blame` + `git log` = full audit trail. The `lint` skill handles hygiene.

For contributions to the Synesis protocol itself (this template repo), PRs welcome.

## License

MIT
