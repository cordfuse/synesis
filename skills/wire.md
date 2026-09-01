---
name: wire
description: Show the exact config that makes this vault visible to agents outside its folder
triggers:
  - wire verb
  - offered at the end of onboard
  - hello names wire when reporting which harness this session is running in
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
   | Antigravity | `~/.gemini/antigravity-cli/` | `~/.gemini/GEMINI.md` | `trustedWorkspaces` in `~/.gemini/antigravity-cli/settings.json` (untested) |
   | Codex CLI | `~/.codex/` | `~/.codex/skills/<vault-name>/SKILL.md` | none needed — reads outside the working directory by default |
   | Copilot CLI | `~/.copilot/` | `~/.copilot/skills/<vault-name>/SKILL.md` | `--add-dir` at launch, or `permissions-config.json` — no config key grants path reads |
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
   - **Harness config** — `trustedFolders` in `~/.copilot/config.json`, `trustedWorkspaces` in
     `~/.gemini/antigravity-cli/settings.json`,
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
   `auth.json` and `%APPDATA%\GitHub Copilot\hosts.json` holds an OAuth token; the
   other harness roots hold credentials of their own. A check for a
   dangling path has no business requesting the folder an auth token lives in, and a
   harness that batches the request will offer to make that access permanent — one
   keystroke from a check into a standing grant over a credential store. Ask for the
   files named above and nothing else.

   **A refusal is an answer.** These files are outside the vault, so a session started
   elsewhere may be told no, and that is the expected path — not a reason to retry
   through a shell or to widen the request. Report the harnesses you could not inspect
   and carry on, exactly as **Working in this vault** in `PROTOCOL.md` requires.

   **This verb is where those refusals belong.** As of v1.15 `hello` no longer audits
   the other harnesses — it reports the one it is running in, which costs nothing, and
   names this verb for the rest. So a developer who sees an approval prompt here asked
   for a config audit and is being asked about config; the same prompt during a
   briefing was noise attached to the wrong verb.

   **Under Copilot CLI these reads need `--add-dir`, and no setting substitutes.**
   Copilot restricts file access to the working directory and below. `trustedFolders`
   in `~/.copilot/config.json` is documented as "folders where permission to read or
   execute files has been granted" and does **not** govern path reads — tested
   2026-08-31 with `~/.claude` listed there, and the read was still refused with
   *"Permission denied and could not request permission from user"*; the same read
   succeeded immediately under `--add-dir`. The dialog's own "add these directories to
   the allowed list" is session state and writes nothing, so it does not carry to the
   next session either. If the developer wants this verb to run without prompts, the
   flags are worth typing for the one run:

   ```
   copilot --add-dir "<VAULT>" --add-dir ~/.claude --add-dir ~/.codex --add-dir ~/.gemini --add-dir ~/.config/opencode
   ```

   Do not print a shell wrapper that bakes this in. A wrapper redefines `copilot` for
   every repo the developer opens, to spare prompts in a verb they run monthly, and
   the same workaround would then be owed to `codex` and `agy`. Claude Code needs none
   of it: `permissions.additionalDirectories` takes the harness roots directly.

   **This supersedes what this skill said at v1.6.** It named `trustedFolders` as
   Copilot's file-access key, on the strength of the vendor's own wording and a
   working setup that had the vault's parent listed. Both readings were wrong, and
   the same test above disproves them. Config keys govern file access for Claude
   Code, Antigravity and OpenCode; under Copilot they do not, and nothing but
   `--add-dir` does.

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

   **Antigravity** — the same text in `~/.gemini/GEMINI.md`, plus the vault's
   absolute path in `trustedWorkspaces`:

   ```json
   {
     "trustedWorkspaces": ["<VAULT>"]
   }
   ```

   in `~/.gemini/antigravity-cli/settings.json` — merge, never overwrite. Note the
   path: Antigravity's own settings live under `antigravity-cli/`, while
   `~/.gemini/settings.json` belongs to Gemini CLI and is a different file.

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

   **File access is a config key for four harnesses, and a launch flag for Copilot.**
   Read the key, and add the vault's absolute path if it is absent. None of them
   needs a shell wrapper:

   | Harness | Where file access is granted | Verified |
   |---|---|---|
   | Claude Code | `permissions.additionalDirectories` in `~/.claude/settings.json` | yes |
   | Codex CLI | nothing — reads outside the working directory by default | yes, 2026-08-27 |
   | Copilot CLI | `--add-dir` at launch, or `permissions-config.json` below | yes, 2026-08-31 |
   | Antigravity | `trustedWorkspaces` in `~/.gemini/antigravity-cli/settings.json` | **untested** |
   | OpenCode | the `references` entry in `~/.config/opencode/opencode.json` | **untested** |

   **Say which rows are untested when you print this.** The two marked above are
   read from config that looks correct and has never been exercised. That is exactly
   the evidence that produced the `trustedFolders` error — vendor wording plus a
   working setup, neither of which is a test. Do not upgrade a row because the
   config looks right.

   Codex is the exception in both directions: it needs no access grant, and it is
   the only one whose *trust* entry does separate work. Trust governs whether the
   vault's own `.codex/config.toml` is read, not whether files can be. A vault can
   be readable and untrusted at once, and that is the state where the vault ships
   settings that are silently ignored.

   **Do not offer a shell wrapper, for any harness.** A wrapper redefines the CLI
   for every repo the developer opens, to spare prompts in a verb they run monthly,
   and the same workaround would then be owed to every other harness. Where a
   durable config key exists, use it. Where one does not — Copilot — the flag is
   typed for the run, or the per-location approvals below are written once.

   **Copilot's shell grant is separate from file access and still worth setting.**
   `--allow-tool 'shell(git:*)'` covers almost all of Copilot's shell calls, because
   this protocol restricts vault shell use to `git` and `date` — the second only
   because `note` and `propose` must read the date rather than infer it. Without the
   flag every git call in `hello` asks for approval separately, per directory, and
   the briefing turns into a consent form.

   **Copilot CLI has a config key for this, and it covers more than the flag can.**
   `~/.copilot/permissions-config.json` records approvals **per location**, so the grant
   is scoped to the vault and nowhere else — no wrapper, no flag to forget, and nothing
   granted to other repos. Prefer it. Read the file and merge; it is the developer's own:

   ```json
   {
     "locations": {
       "<VAULT>": {
         "tool_approvals": [
           { "kind": "commands", "commandIdentifiers": ["git status"] },
           { "kind": "commands", "commandIdentifiers": ["git diff"] },
           { "kind": "commands", "commandIdentifiers": ["git log"] },
           { "kind": "commands", "commandIdentifiers": ["git show"] },
           { "kind": "commands", "commandIdentifiers": ["git config"] },
           { "kind": "commands", "commandIdentifiers": ["git add"] },
           { "kind": "commands", "commandIdentifiers": ["git commit"] },
           { "kind": "commands", "commandIdentifiers": ["git push"] },
           { "kind": "commands", "commandIdentifiers": ["git pull"] },
           { "kind": "commands", "commandIdentifiers": ["git fetch"] },
           { "kind": "commands", "commandIdentifiers": ["git rev-list"] },
           { "kind": "commands", "commandIdentifiers": ["git remote"] },
           { "kind": "commands", "commandIdentifiers": ["git tag"] },
           { "kind": "commands", "commandIdentifiers": ["git ls-tree"] },
           { "kind": "commands", "commandIdentifiers": ["git rev-parse"] },
           { "kind": "commands", "commandIdentifiers": ["git checkout"] },
           { "kind": "commands", "commandIdentifiers": ["git -C"] },
           { "kind": "commands", "commandIdentifiers": ["git -c"] },
           { "kind": "commands", "commandIdentifiers": ["date"] },
           { "kind": "write" }
         ]
       }
     }
   }
   ```

   **`write` is the half the shell flag never covered.** `--allow-tool 'shell(git:*)'`
   grants shell calls only, so `note`, `decide`, `convention` and `weave` — the verbs whose
   whole purpose is writing files — still prompt on every write. A vault that prompts
   hardest while doing its actual job reads as not worth using. Observed 2026-08-29.

   **The list is derived from what the skills actually run.** `git config` for the
   identity read in `hello`, `git -c` for the bounded fetch in `hello`, `git ls-tree`
   and `git checkout` for `reconcile`, `git rev-parse` for this skill's own step 1, and
   `date` for the `date +%F` that `note` and `propose` require. An entry missing from
   this list costs a prompt in the middle of a verb, and `git config` — the identity
   read in the first verb of every session — is the one developers meet first. Observed on a list
   that had the other thirteen, 2026-08-31.

   **This list is not a security boundary, and must not be presented as one.**
   Identifiers match the leading tokens of a command, so `git -C` and `git -c` admit
   *any* git subcommand — the tokens after them are unconstrained. Demonstrated
   2026-08-31 in one session, one directory:

   ```
   git stash list                     ->  refused, git stash is not on the list
   git -c core.pager=cat stash list   ->  ran
   ```

   So the real grant is **git, in a directory the developer approved** — which is what
   `--allow-tool 'shell(git:*)'` says outright, and what `PROTOCOL.md` assumes when it
   requires `git -C` over `cd`. The enumeration exists because this config file has no
   wildcard, not because the subcommands are being restricted.

   **Never tell a developer that removing an entry blocks that command.** Dropping
   `git push` does not prevent `git push --force`: the `git -c` and `git -C` entries
   still reach it. A deny rule at the CLI — `--deny-tool 'shell(git push)'`, which
   takes precedence over any allow — is the mechanism that expresses an exclusion, and
   whether it catches the `-c` prefixed form is untested. If a developer wants a real
   guard on force-push, point them at a pre-push hook or branch protection, which do
   not depend on how the command was spelled.

   **Approvals key on the directory Copilot was launched from, not the one it is
   reading.** A vault entry does nothing for a session started in a parent folder or
   another repo — the approvals for *that* directory apply instead. Say so: vault
   verbs belong in a session rooted at the vault.

   **Copilot in VS Code is a different mechanism, and a workspace file silently
   disables the vault's own settings.** The vault ships `.vscode/settings.json` with
   `chat.tools.terminal.autoApprove`. That setting is **window-scoped**: when a
   `.code-workspace` is open, folder settings are ignored entirely and only the
   workspace file's `settings` block applies. A generated workspace carrying
   `"settings": {}` therefore turns the vault's auto-approve off while everything looks
   correctly configured — the vault's file is present, committed, and inert. Either
   open the vault folder directly, or copy the block into the workspace file:

   ```json
   "settings": {
     "chat.tools.terminal.autoApprove": {
       "/^\\s*git\\s+(status|diff|log|show|config|add|commit|push|pull|fetch|rev-list|remote|tag|checkout|ls-tree|rev-parse)\\b/": true,
       "/^\\s*git\\s+-C\\s+(\"[^\"]*\"|\\S+)\\s+(status|diff|log|show|config|add|commit|push|pull|fetch|rev-list|remote|tag|checkout|ls-tree|rev-parse)\\b/": true,
       "/^\\s*git\\s+(?:-c\\s+(?:[^\\s\"]|\"[^\"]*\")+\\s+)+fetch\\b/": true,
       "/^\\s*date\\b/": true,
       "/^\\s*git\\s+(?:-C\\s+(?:\"[^\"]*\"|\\S+)\\s+)?push\\s+--force/": false,
       "/^\\s*git\\s+(?:-C\\s+(?:\"[^\"]*\"|\\S+)\\s+)?config\\s+--global/": false
     }
   }
   ```

   Observed 2026-08-29 on a vault whose folder settings were correct and whose
   generated workspace file was empty: prompts in the workspace, none in the folder.

   **A bare subcommand list is not enough.** Rules match the *start* of a command, so
   `git -C <vault> status` and `hello`'s `git -c core.sshCommand=... fetch` match none
   of them — the second begins `git -c`, not a subcommand name. Both prefixed forms
   need a rule of their own, and the exclusions need the `-C` form too, or
   `git -C <vault> push --force` is approved by the rule meant to allow reads.
   Observed 2026-08-31.

   **Here the list is a real boundary, unlike the CLI.** These are regular expressions
   rather than command stems, so `git stash` and anything unlisted still prompt, and
   `push --force` can genuinely be excluded. That is the one thing VS Code expresses
   which `permissions-config.json` cannot.


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
