---
name: hello
description: Deliver a team briefing for the current user
triggers:
  - hello verb
  - start of session (if the harness supports it)
---

# Hello

When triggered, identify the current user and deliver a team briefing.

From a session started outside the vault, prefix every git call below with
`-C <vault-path>`. Never `cd <vault-path>; git ...` — see **Working in this vault**
in `PROTOCOL.md`.

## Steps

1. **Ensure an `upstream` remote exists.** Vaults are created with "Use this template",
   so a fresh clone has none — remotes are per-clone and do not travel with the repo.
   If it is missing, derive it from the `upstream:` field in `PROTOCOL.md` frontmatter,
   **matching the form `origin` already uses**:

   ```sh
   git remote get-url origin
   ```

   If `origin` is `git@host:owner/repo.git`, build the upstream URL the same way with
   the same host — that host is often an SSH alias, and on a machine juggling several
   accounts it is the only thing that authenticates. Fall back to
   `https://github.com/<repo>.git` only when `origin` is itself https. Never hardcode
   a URL; some vaults are forks or private mirrors.

2. **Fetch both remotes, once, bounded.** One call serves the staleness check and the
   version check:

   ```sh
   git -c core.sshCommand="ssh -o ConnectTimeout=5 -o BatchMode=yes" \
       -c credential.interactive=false \
       -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=5 \
       fetch --multiple --tags --quiet origin upstream
   ```

   Drop `upstream` from the argument list if step 1 could not establish it.

   The bounds matter: an unreachable host hangs, and a credential prompt hangs worse.
   `BatchMode=yes` stops ssh asking for a passphrase, `credential.interactive=false`
   lets the credential manager use a cached token while refusing to prompt for one,
   and the low-speed options cap a stalled transfer. If the fetch fails or times out,
   continue with the briefing silently — being unable to check is not worth blocking
   on.

   **Do not blank the helper with `-c credential.helper=`.** That removes the
   credentials rather than the prompt, so a private vault over https fails every time
   and reports itself uncheckable forever rather than occasionally.

   **Do not reach for `timeout`.** Granting `Bash(timeout:*)` to make it work would
   permit `timeout 1 <anything>` — arbitrary execution wearing a wrapper.

3. **Check whether the vault is behind its own remote.** A briefing built on stale
   files reports the team's state as it was, not as it is.

   ```sh
   git rev-list --count HEAD..origin/main
   ```

   If the count is above zero, say how many commits behind and suggest `sync` before
   continuing. **Do not pull, commit or push** — this verb reads.

4. **Identify the user.** Read `git config user.name` and `git config user.email`.
   Check `people/` for a profile where `email` matches, or an `aliases` entry does —
   people commit under more than one address.

5. **If no profile exists:** trigger the `onboard` skill instead. Do not continue with
   the briefing.

6. **If a profile exists:** deliver the briefing below.

**Do not touch `last-seen`.** It is owned by `catchup`, which uses it as the baseline
for what changed since you last asked. Overwriting it here destroys that baseline
silently — `hello` followed by `catchup` would report no changes no matter how much
had happened.

## Briefing format

Greet the user by name, then cover these sections in order.

**Every section is built from frontmatter, and you read it with your file tools.**
Batching the corpus into one `Get-ChildItem`/`find`/`grep` pipeline is the obvious
optimisation and the wrong one: a shell pipeline that reads files is refused outright
in a vault-rooted session, and becomes an approval prompt per command in a wired one.
Reading many files at once is still reading — use whatever bulk read or search your
harness gives you.

### Team
- How many people are on the team (count of `people/` profiles, excluding `_template.md`)
- List each person: name, role, and expertise tags (from their profile)

### Open questions
- Any records with `status: proposed` — the questions the team has not answered yet
- For each: title, date opened, who is `consulted`, and how long it has been open
- Flag any older than `stale-days` as overdue. An open question nobody revisits is the failure mode this state exists to prevent
- If there are none, say so in one line and move on

### Deadlines
- Any record or convention (not archived) whose `deadline:` falls within the next 60 days, or has already passed
- For each: file, the date, and how far away or how overdue it is
- Omit the section entirely when there are none — a briefing does not report the absence of deadlines

### Recent decisions
- List the last 5-10 records by `date` in frontmatter (most recent first)
- Skip records with `archived: true`
- For each: title, date, decided-by, and status (`accepted` or `rejected`; notes carry none)
- If any carry a `superseded-by` pointer, show them as superseded and name the replacement. "Superseded" is derived from that field, never from `status`

### Active conventions
- List all files in `conventions/` (excluding `_template.md` and files with `archived: true`)
- For each: its `name` and `tags`, from frontmatter. The name is the summary — do not open bodies to write descriptions; that turns a frontmatter pass into a full read of every convention, every session
- Flag any with `last-verified` older than `stale-days` (from PROTOCOL.md frontmatter)

### Vault status
- Protocol version (from PROTOCOL.md frontmatter)
- Upstream tracking (if `upstream` field exists in PROTOCOL.md frontmatter)
- Whether this machine is wired up — **the harness you are running in, and nothing
  else.** If this session loaded the vault's skill or instruction file, that harness
  is wired: the session could not have begun this way otherwise. Report it in one
  line, name `wire` for the rest, and read nothing:

  > Wired: Copilot CLI (this session). Run `wire` to check the others.

  **A briefing does not audit the other harnesses.** It did until v1.15, at seven
  reads outside the working directory every session — silent waste where they are
  permitted, seven approval dialogs before the developer has read a word where they
  are not. `wire` does it properly and on the right cadence: it resolves each path,
  separates *stale* from *not wired*, and knows when a missing trust entry makes the
  vault's own config inert. Report your own harness, name `wire`, move on.
- Any active handoff records (records tagged `handoff` with no superseding record)
- Count of tools in `tools/` (if any beyond README.md)
- Whether a newer protocol version is available upstream — see **Version check**
  below. One line, and only when there is something to say.

### Available verbs
- List all verbs by reading `skills/*.md` frontmatter (`name` + `description`), excluding `_template.md`

## Version check

Part of vault status. **It must never block, prompt, or fail the briefing.** A briefing
that stalls on a network call is worse than one that never mentions versions.

1. **Read `version:` from `PROTOCOL.md` frontmatter** — the protocol this vault
   currently holds. It travels with the file it describes, so it cannot drift from the
   protocol actually in the vault. If the field is missing, say nothing.

2. **Compare the newest tag against that version.** The tags arrived with the fetch in
   step 2; no second network call is needed. List them in one call and read the newest
   from the output yourself — do not pipe into `head`, `Select-Object` or `findstr`,
   which turns one git call into a compound no approval rule can match:

   ```sh
   git tag --sort=-v:refname
   ```

   If the newest tag is newer than this vault's version, append one line to vault
   status:

   > Protocol v0.7 available upstream — say `reconcile` to review the changes.

3. **Otherwise say nothing.** No file, no remote, no network, no tags, fetch timed out,
   already current — every one of those is silent. Never nudge twice for the same
   version in a session.

## Notes

- Keep the briefing scannable. Use short lines, not paragraphs.
- Source everything from actual vault files. Never invent context.
- If the vault is sparse (few records, few people), say so -- don't pad.
