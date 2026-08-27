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

1. **Resolve the vault path and its name.** Run `git rev-parse --show-toplevel`.
   Use that absolute path verbatim in every snippet, and take the vault's name
   from the last segment of it — `product-vault`, `design-vault`, whatever the
   folder is actually called.

   **`<vault-name>` below is a placeholder. Substitute the real name everywhere
   it appears** — in skill paths, in `name:` fields, and in JSON keys. Likewise
   never print a `~/team/vault` placeholder for the path. A snippet the developer
   has to translate before pasting is the reason manual setup does not happen.

   **The verb list in the skill description is derived, not copied.** Read the `name:`
   field from every `skills/*.md` in this vault and list what you find. The list
   printed below shows the shape, not the content — a vault that has gained or lost a
   verb since this file was written must not inherit the stale list. This is the same
   discovery rule PROTOCOL.md states for verbs everywhere else.

2. **Detect what is installed.** Show only harnesses that are actually present.

   | Harness | Present if | Instruction discovery | File access |
   |---|---|---|---|
   | Claude Code | `~/.claude/` | `~/.claude/CLAUDE.md` | `permissions.additionalDirectories` in `~/.claude/settings.json` |
   | Antigravity | `~/.gemini/antigravity-cli/` | `~/.gemini/GEMINI.md` | `agy --add-dir <vault>` |
   | Codex CLI | `~/.codex/` | `~/.codex/skills/<vault-name>/SKILL.md` | `codex --add-dir <vault>` |
   | Copilot CLI | `~/.copilot/` | `~/.copilot/skills/<vault-name>/SKILL.md` | `copilot --add-dir <vault>` |
   | OpenCode | `~/.config/opencode/` | `~/.config/opencode/skills/<vault-name>/SKILL.md` | `references` entry in `~/.config/opencode/opencode.json` |

   If none are present, say so in one line and show the Claude Code snippet as the
   common case.

   **Antigravity is detected by the `antigravity-cli/` subdirectory, not by `~/.gemini/`
   itself.** Gemini CLI uses the same parent directory, so its presence proves nothing.
   Confirmed both ways on 2026-08-24: the subdirectory is present on a machine with
   Antigravity installed and absent on a Windows machine that had only Gemini CLI.

   **OpenCode on Windows is unconfirmed.** The docs give `~/.config/opencode/` with no
   platform variation, so this row should hold there as `%USERPROFILE%\.config\opencode\`,
   but it has not been seen working — the Windows machine it was tested on did not have
   OpenCode installed, which proves nothing either way. `OPENCODE_CONFIG_DIR` overrides
   the location when set. If the directory is missing but the `opencode` binary is on
   PATH, say the config location is uncertain rather than printing a path that may be
   wrong.

3. **Check what is already wired, and what has gone stale.** Two separate questions.

   **Wired** — the harness's instruction file or skill carries *this* vault's path.
   Report as already wired and do not reprint.

   **Stale** — wiring that names a path which no longer resolves, or a different
   folder than this vault. It hides in two kinds of file:

   - **Skills** — `SKILL.md` under `~/.codex/skills/<name>/`, `~/.copilot/skills/<name>/`
     and `~/.config/opencode/skills/<name>/`. Resolve the vault path each one names.
   - **Harness config** — `trustedFolders` in `~/.copilot/config.json`,
     `permissions.additionalDirectories` in `~/.claude/settings.json`, and the
     `[projects.'<vault>']` trust entry in `~/.codex/config.toml`. A vault can be
     stale in one and current in the other.

   **A missing Codex trust entry is not cosmetic.** Codex reads a project-local
   `.codex/config.toml` *only* for projects it trusts, and an untrusted project falls
   back to conservative defaults whatever the global config says. So a vault that
   ships its own Codex settings has them silently ignored, and every command prompts —
   the skill is present, the wiring looks correct, and the thing that makes it
   effective is absent. Codex writes these paths lowercased; compare lowercased or the
   match will not hit. Observed 2026-08-27.

   **Name exact files. Never ask for a harness directory.** `~/.codex` holds
   `auth.json`; the other harness roots hold credentials of their own. A check for a
   dangling path has no business requesting the folder an auth token lives in, and a
   harness that batches the request will offer to make that access permanent — one
   keystroke from a check into a standing grant over a credential store. Ask for the
   files named above and nothing else.

   **A refusal is an answer.** These files are outside the vault, so a session started
   elsewhere may be told no, and that is the expected path — not a reason to retry
   through a shell or to widen the request. Report the harnesses you could not inspect
   and carry on, exactly as **Working in this vault** in `PROTOCOL.md` requires.

   A renamed or moved vault leaves all of it behind, pointing nowhere, and the
   developer sees no error — the skill is still `alwaysApply: true`, it just
   describes a folder that is gone. Name the exact file or directory to fix. Do not
   change it as part of this verb; the rule below still holds.

4. **Print the snippets.** Exact content, real path, ready to paste. Substitute the
   path from step 1 wherever `<VAULT>` appears below — never print `<VAULT>` itself,
   and never print a `~/team/vault` placeholder. Where a harness needs both
   instruction discovery and file access, print both and say they are both required —
   one without the other fails quietly.

   **Claude Code** — create or append to `~/.claude/CLAUDE.md`:

   ```
   At the start of every session, read and follow PROTOCOL.md in the team's
   knowledge vault at <VAULT>

   When the user says "hello", run the hello skill from that vault's skills/
   directory. Read the matching skills/<verb>.md before acting on any other verb.

   A repository's own CLAUDE.md wins where the two disagree. Never write vault
   content unprompted — recording a decision is an explicit request.
   ```

   **The verb sentence is not optional.** Without it the agent loads the path, treats
   `hello` as a greeting and answers like one — wiring that looks correct and does
   nothing. Confirmed 2026-08-26.

   The global file makes the vault *discoverable*; it does not make it *readable*. A
   session started in another repository reads the vault from outside its working
   directory, which Claude Code refuses. Add the vault to the allowed list — read
   `~/.claude/settings.json` and merge, never overwrite:

   ```json
   {
     "permissions": {
       "additionalDirectories": ["<VAULT>"]
     }
   }
   ```

   Both halves are required, and the failure without the second is silent: the
   session simply answers as if no vault existed.

   **Antigravity** — the same text in `~/.gemini/GEMINI.md`, plus file access at launch:

   ```
   agy --add-dir "<VAULT>"
   ```

   **Codex CLI** and **Copilot CLI** — a personal skill at
   `~/.codex/skills/<vault-name>/SKILL.md` or `~/.copilot/skills/<vault-name>/SKILL.md`:

   ```markdown
   ---
   name: <vault-name>
   description: Team knowledge protocol — always active. Handles hello, status, catchup, propose, decide, note, convention, lint, search, sync, reconcile, archive, update, onboard, handoff, weave, wire verbs.
   alwaysApply: true
   ---

   At the start of every session, read and follow PROTOCOL.md in the team's
   knowledge vault at <VAULT>

   When the user says "hello", run the hello skill from that vault's skills/
   directory. Read the matching skills/<verb>.md before acting on any other verb.
   ```

   **Codex also needs the vault trusted**, or the `.codex/config.toml` the vault
   ships is never read. Add to `~/.codex/config.toml`, path lowercased:

   ```toml
   [projects.'<vault-path-lowercased>']
   trust_level = "trusted"
   ```

   Plus file access at launch — **both are required**:

   ```
   codex   --add-dir "<VAULT>"
   copilot --add-dir "<VAULT>"
   ```

   A flag typed at launch is forgotten at launch. Offer a durable form — a shell
   wrapper works everywhere:

   ```powershell
   # PowerShell profile ($PROFILE)
   $VaultPath = '<VAULT>'
   function codex   { & (Get-Command codex.cmd   -CommandType Application).Source --add-dir $VaultPath @args }
   function copilot { & (Get-Command copilot.cmd -CommandType Application).Source --add-dir $VaultPath --allow-tool 'shell(git:*)' @args }
   ```

   ```sh
   # ~/.bashrc or ~/.zshrc
   alias codex='codex --add-dir "<VAULT>"'
   alias copilot='copilot --allow-tool="shell(git:*)" --add-dir "<VAULT>"'
   ```

   `--allow-tool 'shell(git:*)'` is the whole grant Copilot needs, because this
   protocol already restricts vault shell use to git. Without it every git call in
   `hello` asks for approval separately, per directory, and the briefing turns into a
   consent form. If a CLI grows a config key for trusted directories, prefer it over
   the wrapper.

   **OpenCode** — the same skill at `~/.config/opencode/skills/<vault-name>/SKILL.md`
   without the `alwaysApply` line, plus a `references` entry in
   `~/.config/opencode/opencode.json`:

   ```json
   {
     "references": {
       "<vault-name>": {
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
