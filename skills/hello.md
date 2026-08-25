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
       -c credential.helper= \
       -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=5 \
       fetch --quiet origin
   git rev-list --count HEAD..origin/main
   ```

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
- Whether this machine is wired up — check the global instruction file of each
  installed harness for this vault's absolute path. If none carry it, say so in one
  line and name `wire`: the vault is invisible to sessions started outside this
  folder, and that reads as "Synesis does not do much" when the truth is it was
  never switched on. Do not configure anything — `wire` prints, the developer applies.
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
       -c credential.helper= \
       -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=5 \
       fetch --tags --quiet upstream
   ```

   `BatchMode=yes` stops ssh asking for a passphrase, the empty credential helper
   stops https asking for a password, and the low-speed options cap a stalled
   transfer. Every one of these is a `git` option, so the whole check stays inside
   the `Bash(git:*)` grant in `.claude/settings.json`.

   **Do not reach for `timeout` here.** Allowing `Bash(timeout:*)` to make that work
   would permit `timeout 1 <anything>`, which is arbitrary command execution wearing
   a wrapper — a far wider grant than the one it was meant to support.

4. **Compare the newest tag against that version.** If the tag is newer, append one
   line to vault status:

   > Protocol v0.7 available upstream — say `reconcile` to review the changes.

5. **Otherwise say nothing.** No file, no remote, no network, no tags, fetch timed
   out, already current — every one of those is silent. Never nudge twice for the
   same version in a session, and do not fetch again if the check already ran today.

## Notes

- Keep the briefing scannable. Use short lines, not paragraphs.
- Source everything from actual vault files. Never invent context.
- If the vault is sparse (few records, few people), say so -- don't pad.
