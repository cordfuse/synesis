# Synesis

**Shared team knowledge for AI coding agents.**

Synesis (Greek: σύνεσις — *understanding, the faculty of putting things together*) is a file-based, repo-embedded, agent-agnostic shared knowledge protocol for software teams.

## What it is

Markdown files in a git repo. No server, no database, no API keys, no SaaS. Clone and go.

Your team's decisions, conventions, people profiles, and institutional memory live here — readable by any AI coding agent that can open a file.

## What it is not

- Not a SaaS product
- Not an MCP server
- Not an npm package
- Not a database

## How it works

1. **Fork this repo.** Make it yours.
2. **Add your team.** Each member gets a profile in `people/`.
3. **Record decisions.** Use the `decide` verb to capture what you decided, why, and who was involved.
4. **Document conventions.** Put your team standards in `conventions/`.
5. **Let agents read it.** Any AI coding agent (Claude Code, Codex, Copilot, etc.) discovers the protocol through harness-specific shim files and inherits your team's knowledge.

## Supported harnesses

| Harness | Shim file |
|---|---|
| Claude Code | `CLAUDE.md` |
| OpenAI Codex | `AGENTS.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |

All three work in both CLI and VS Code. Adding a new harness = adding a one-line shim file.

## VS Code multi-root workspace

For VS Code users, open Synesis alongside your project repos in a multi-root workspace. The agent sees both — your project code and your team's knowledge:

```json
{
  "folders": [
    { "path": "../synesis" },
    { "path": "../my-project" }
  ]
}
```

A template `synesis.code-workspace` file is included.

## Verbs

Verbs are commands you give to the agent. See `VERBS.md` for the full list.

| Verb | What it does |
|---|---|
| `hello` | Team briefing |
| `onboard` | New member setup |
| `decide` | File a decision |
| `handoff` | Transfer work |
| `lint` | Check vault hygiene |
| `search` | Find knowledge |

## Obsidian-compatible

This vault doubles as an Obsidian vault. `[[wikilinks]]` for internal linking, tags and aliases in frontmatter. `.obsidian/` is gitignored (per-user config).

## License

MIT
