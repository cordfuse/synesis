---
name: wire
description: Show the exact config that makes this vault visible to agents outside its folder
triggers:
  - wire verb
  - offered at the end of onboard
  - hello reports the vault is not wired up
---

# Wire

Print the configuration a developer needs so this vault loads in sessions started
outside its folder. A vault the agent cannot find is a vault nobody uses — but
the fix lives on the developer's machine, not in this repo.

**This skill never writes outside the repo.** It detects what is installed, fills
in the real paths, and shows the developer exactly what to paste. Applying it is
their call.

## Why print instead of write

- The files involved load in *every* project on the machine, not just this one.
  A vault that edits them changes how unrelated repos behave.
- Wiring is per-machine; profiles are per-person. Someone with a laptop and a
  desktop onboards once and wires twice.
- Printing is idempotent by definition — no marker to manage, no existing JSON to
  merge, no second PowerShell edition left silently dead.

## Steps

1. **Resolve the vault path.** Run `git rev-parse --show-toplevel`. Use that
   absolute path verbatim in every snippet. Never print a `~/team/synesis`
   placeholder — a path the developer has to translate is the reason manual setup
   does not happen.

2. **Detect what is installed.** Show only harnesses that are actually present.

   | Harness | Present if | Instruction discovery | File access |
   |---|---|---|---|
   | Claude Code | `~/.claude/` | `~/.claude/CLAUDE.md` | covered by the path in that file |
   | Antigravity | `~/.gemini/` | `~/.gemini/GEMINI.md` | `agy --add-dir <vault>` |
   | Codex CLI | `~/.codex/` | `~/.codex/skills/synesis/SKILL.md` | `codex --add-dir <vault>` |
   | Copilot CLI | `~/.copilot/` | `~/.copilot/skills/synesis/SKILL.md` | `copilot --add-dir <vault>` |
   | OpenCode | `~/.config/opencode/` | `~/.config/opencode/skills/synesis/SKILL.md` | `references` entry in `~/.config/opencode/opencode.json` |

   If none are present, say so in one line and show the Claude Code snippet as the
   common case.

   **Two detection caveats, verified on Windows 2026-08-24:**

   `~/.config/opencode/` is a Unix convention and **is not confirmed on Windows** —
   there is no `~/.config` directory on a Windows profile at all. If OpenCode is in
   use, find its real config location before trusting this row.

   `~/.gemini/` present does **not** prove Antigravity is installed. Gemini CLI uses
   the same directory. Check for something Antigravity-specific before printing its
   snippet, or say the detection is uncertain.

3. **Check what is already wired.** For each detected harness, look for the vault
   path in its instruction file. Report those as already wired and do not reprint
   them. Only what is missing is worth showing.

4. **Print the snippets.** Exact content, real path, ready to paste. Substitute the
   path from step 1 wherever `<VAULT>` appears below — never print `<VAULT>` itself,
   and never print a `~/team/synesis` placeholder. Where a harness needs both
   instruction discovery and file access, print both and say they are both required —
   one without the other fails quietly.

   **Claude Code** — append to `~/.claude/CLAUDE.md`:

   ```
   Read and follow PROTOCOL.md in the team's synesis vault at <VAULT>

   A repository's own CLAUDE.md wins where the two disagree. Never write vault
   content unprompted — recording a decision is an explicit request.
   ```

   Nothing else is needed; Claude Code reads any path from the global file alone.

   **Antigravity** — the same text in `~/.gemini/GEMINI.md`, plus file access at launch:

   ```
   agy --add-dir "<VAULT>"
   ```

   **Codex CLI** and **Copilot CLI** — a personal skill at
   `~/.codex/skills/synesis/SKILL.md` or `~/.copilot/skills/synesis/SKILL.md`:

   ```markdown
   ---
   name: synesis
   description: Team knowledge protocol — always active. Handles hello, status, catchup, propose, decide, note, convention, lint, search, sync, reconcile, archive, update, onboard, handoff, weave, wire verbs.
   alwaysApply: true
   ---

   At the start of every session, read and follow PROTOCOL.md in the team's
   synesis vault at <VAULT>

   When the user says "hello", run the hello skill from that vault's skills/
   directory. Read the matching skills/<verb>.md before acting on any other verb.
   ```

   Plus file access at launch — **both are required**:

   ```
   codex   --add-dir "<VAULT>"
   copilot --add-dir "<VAULT>"
   ```

   **OpenCode** — the same skill at `~/.config/opencode/skills/synesis/SKILL.md`
   without the `alwaysApply` line, plus a `references` entry in
   `~/.config/opencode/opencode.json`:

   ```json
   {
     "references": {
       "synesis": {
         "path": "<VAULT>",
         "description": "Team knowledge vault — conventions, decisions, people profiles. Read PROTOCOL.md for the protocol."
       }
     }
   }
   ```

   Read that file and merge the entry — never overwrite a config that may already
   be the developer's own.

5. **Say what happens next.** Wiring takes effect in new sessions, not the current
   one. Nothing needs to change in this repo.

## Notes

- Do not write to `~/.claude/`, `~/.codex/`, `~/.copilot/`, `~/.gemini/` or
  `~/.config/opencode/` as part of this skill, and do not offer to. If a developer
  asks you directly to apply one of these in their own session, that is their
  instruction to their agent — but it is not something this verb does on its own.
- Declining is a normal outcome. The vault works fully when opened directly.
- A repository's own instructions win over the global file. Wiring adds a
  knowledge source; it never overrides a project's rules.
