---
name: hello
description: Deliver a team briefing for the current user
triggers:
  - hello verb
  - start of session (if the harness supports it)
---

# Hello

When triggered, identify the current user and deliver a team briefing.

## Steps

1. **Check whether the vault is behind its own remote.** A briefing built on stale files reports the team's state as it was, not as it is.

   ```sh
   git -c core.sshCommand="ssh -o ConnectTimeout=5 -o BatchMode=yes" \
       -c credential.interactive=false \
       -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=5 \
       fetch --quiet origin
   git rev-list --count HEAD..origin/main
   ```

   From a session started outside the vault, prefix each of those with
   `-C <vault-path>` rather than changing directory first — see **Working in this
   vault** in `PROTOCOL.md`. A `cd ...; git ...` compound cannot be allow-listed,
   because its stem is `cd`, and it turns the briefing into a consent form.

   If the count is above zero, say how many commits behind and suggest `sync`
   before continuing. **Do not pull, commit or push** — this step reads.

   Bounded for the same reason the version check is: an unreachable host hangs and
   a credential prompt hangs worse. If the fetch fails or times out, continue with
   the briefing silently. Being unable to check is not worth blocking on.

2. **Identify the user.** Read `git config user.name` and `git config user.email`. Check `people/` for a profile where `email` matches.

3. **If no profile exists:** Trigger the `onboard` skill instead. Do not continue with the briefing.

4. **If a profile exists:** Deliver the briefing below.

**Do not touch `last-seen`.** It is owned by `catchup`, which uses it to work out what changed since you last asked. Overwriting it here silently destroys that baseline — `hello` followed by `catchup` would report no changes no matter how much had happened.

## Briefing format

Greet the user by name, then cover these sections in order:

**Every section below is built from frontmatter, and you read it with your file
tools.** This briefing touches most files in the vault, and batching them into one
`Get-ChildItem`/`find`/`grep` pipeline is the obvious optimisation and the wrong one.
Reading many files at once is still reading — use whatever bulk read or search your
harness gives you.

The cost is not stylistic. A shell pipeline that reads files is refused outright in a
vault-rooted session, and in a wired session started elsewhere it becomes an approval
prompt per command, so a briefing turns into a consent form. Both failures are
recoverable — you fall back to the read tool and finish — which is exactly why the
habit survives. Do not start there. Measured on Copilot CLI, 2026-08-26: every git
call in this skill was permitted by a single narrow rule; the only refusals left were
four PowerShell pipelines reading frontmatter.

### Team
- How many people are on the team (count of `people/` profiles, excluding `_template.md`)
- List each person: name, role, and expertise tags (from their profile)

### Open questions
- Any records with `status: proposed` — the questions the team has not answered yet
- For each: title, date opened, who is `consulted`, and how long it has been open
- Flag any older than `stale-days` as overdue. An open question nobody revisits is the failure mode this state exists to prevent
- If there are none, say so in one line and move on

### Recent decisions
- List the last 5-10 records by `date` in frontmatter (most recent first)
- Skip records with `archived: true`
- For each: title, date, decided-by, and status (`accepted` or `rejected`; notes carry none)
- If any carry a `superseded-by` pointer, show them as superseded and name the replacement. "Superseded" is derived from that field, never from `status`

### Active conventions
- List all files in `conventions/` (excluding `_template.md` and files with `archived: true`)
- For each: name and a one-line summary of what it covers
- Flag any with `last-verified` older than `stale-days` (from PROTOCOL.md frontmatter)

### Vault status
- Protocol version (from PROTOCOL.md frontmatter)
- Upstream tracking (if `upstream` field exists in PROTOCOL.md frontmatter)
- Whether this machine is wired up — **the harness you are running in, and nothing
  else.** If this session loaded the vault's skill or instruction file, that harness
  is wired: the session could not have begun this way otherwise, and you are reading
  these words as the proof. Report it in one line, name `wire` for the rest, and read
  nothing:

  > Wired: Copilot CLI (this session). Run `wire` to check the others.

  **A briefing does not audit the other harnesses.** Until v1.15 it read four wiring
  files and three config files under the home directory to do so. That is the wrong
  verb and the wrong cadence, for three reasons, each sufficient on its own:

  - **Cadence.** Wiring changes when someone installs a harness or moves the vault —
    monthly at most. Auditing it on every briefing is a linter on every keystroke.
  - **Cost.** Seven reads outside the working directory, every session, on every
    harness. Where they are permitted they are silent and wasteful; where they are
    not, they are seven approval dialogs before the developer has read a word.
    Copilot CLI restricts file access to the working directory and below and has no
    persistent setting that grants an exception, so there the cost is paid in
    prompts, in full, every session. Observed 2026-08-31.
  - **Quality.** `wire` does this properly. It resolves each path, separates *stale*
    from *not wired*, and knows that a missing Codex trust entry makes the vault's
    own config inert. A briefing answering yes or no cannot match that, and one that
    tried would be `wire` with a worse name.

  So: report your own harness for free, say `wire` once, and move on. The developer
  who wants the full picture has a verb for it.
- Any active handoff records (records tagged `handoff` with no superseding record)
- Count of tools in `tools/` (if any beyond README.md)
- Whether a newer protocol version is available upstream — see **Version check**
  below. One line, and only when there is something to say.

### Available verbs
- List all verbs by reading `skills/*.md` frontmatter (`name` + `description`)

## Version check

Part of vault status. **It must never block, prompt, or fail the briefing.** A
briefing that stalls on a network call is worse than one that never mentions
versions.

1. **Read `version:` from `PROTOCOL.md` frontmatter** — the protocol this vault
   currently holds. It travels with the file it describes: when `reconcile` pulls
   `PROTOCOL.md`, the number comes with it, so it cannot drift from the protocol
   actually in the vault. If the field is missing, say nothing — a vault with no
   version is not a vault this check can reason about.

2. **Ensure an `upstream` remote exists.** Vaults are created with "Use this
   template", so a fresh clone has none — remotes are per-clone and do not travel
   with the repo. If it is missing, derive it from the `upstream:` field in
   `PROTOCOL.md` frontmatter, **matching the form `origin` already uses**:

   ```sh
   git remote get-url origin
   ```

   If `origin` is `git@host:owner/repo.git`, build the upstream URL the same way with
   the same host. That host is often an SSH alias from the developer's ssh config, and
   it is the only thing that authenticates on machines juggling several accounts. Fall
   back to `https://github.com/<repo>.git` only when `origin` is itself https. Never
   hardcode a URL — every vault comes from its own template, and some are forks or
   private mirrors.

3. **Fetch tags, bounded.** A fetch against an unreachable host hangs; one against a
   private repo without cached credentials prompts, which hangs worse. Bound it with
   git's own options rather than an external wrapper:

   ```sh
   git -c core.sshCommand="ssh -o ConnectTimeout=5 -o BatchMode=yes" \
       -c credential.interactive=false \
       -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=5 \
       fetch --tags --quiet upstream
   ```

   `BatchMode=yes` stops ssh asking for a passphrase, `credential.interactive=false`
   lets the credential manager use a cached token while refusing to prompt for one,
   and the low-speed options cap a stalled transfer.

   **Do not blank the helper with `-c credential.helper=`.** That suppresses the
   prompt by removing the credentials, so a private vault fetched over https fails
   every single time — `could not read Username` — and the vault reports itself as
   uncheckable forever rather than occasionally. Confirmed 2026-08-26. Every one of these is a `git` option, so the whole check stays inside
   the `Bash(git:*)` grant in `.claude/settings.json`.

   **Do not reach for `timeout` here.** Allowing `Bash(timeout:*)` to make that work
   would permit `timeout 1 <anything>`, which is arbitrary command execution wearing
   a wrapper — a far wider grant than the one it was meant to support.

4. **Compare the newest tag against that version.** List the tags in one call and read
   the newest from the output yourself — do not pipe into `head`, `Select-Object` or
   `findstr`, which turns one git call into a compound no approval rule can match:

   ```sh
   git tag --sort=-v:refname
   ```

   If the newest tag is newer than this vault's version, append one line to vault
   status:

   > Protocol v0.7 available upstream — say `reconcile` to review the changes.

5. **Otherwise say nothing.** No file, no remote, no network, no tags, fetch timed
   out, already current — every one of those is silent. Never nudge twice for the
   same version in a session, and do not fetch again if the check already ran today.

## Notes

- Keep the briefing scannable. Use short lines, not paragraphs.
- Source everything from actual vault files. Never invent context.
- If the vault is sparse (few records, few people), say so -- don't pad.
