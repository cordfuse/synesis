---
name: reconcile
description: Deep drift check against the upstream template — surfaces every divergence, resolves each with explicit approval
triggers:
  - reconcile verb
  - drift check
  - deep sync
  - check upstream
---

# Reconcile

When triggered, diff this vault's **template scope** against the upstream template repo and resolve each drifted file with explicit user approval.

This is not `sync`. `sync` moves your own commits between you and your remote. `reconcile` compares your vault against the template it was created from, which is a different repo with no shared history.

**Reconcile can overwrite local edits.** Every file is gated individually. Nothing is applied silently, and nothing is applied in a batch the user did not approve.

## Template scope

Only these paths are compared. Everything else is vault-local and is **never** touched by reconcile:

| In scope | Why |
|---|---|
| `PROTOCOL.md` | the protocol itself |
| `skills/*.md` | verb definitions |
| `*/_template.md` | frontmatter shapes |
| `AGENTS.md` | agent entry point |

Explicitly **out of scope**: `records/`, `conventions/`, `people/`, `attachments/`, `tools/`, `README.md`, `CLAUDE.md`, `LICENSE`, `.synesis-version`, and any other agent instruction file. That content is the team's, not the template's. `README.md` and `CLAUDE.md` are expected to diverge immediately and permanently — flagging them every run would train the user to ignore the report.

`.synesis-version` is operator state, not protocol — it records where *this* vault stands and is written by reconcile itself at the end of a run. Diffing it would report drift on every vault that is behind, which is the condition it exists to describe.

`LICENSE` never comes down, and the reason is worth stating plainly: the template is a public MIT repo, and most vaults built from it are not. Copying its licence onto a private vault puts the template author's copyright line on the team's own conventions, decisions, people profiles and whatever else the vault holds, and offers all of it under MIT. If a vault needs a licence it writes its own.

## Setup

Your vault inherits an `upstream:` field in `PROTOCOL.md` frontmatter naming the template it came from and the protocol version it was created at. That is provenance, not configuration — nothing reads it automatically.

What you do need is a remote. Vaults are created with GitHub's "Use this template", so there is **no fork relationship and no upstream remote by default**:

```sh
git remote add upstream <template-repo-url>
git fetch upstream
```

`hello` adds this remote automatically the first time it runs a version check,
deriving the URL from the `upstream:` field and matching the form `origin` already
uses. The commands above are the fallback for anyone who never runs `hello`, or
whose vault came from a fork or private mirror the derivation cannot guess.

The two repos have unrelated histories — a template copy starts with a fresh commit. `git diff` works fine across them; `git merge-base` returns nothing. Never attempt a merge, rebase, or pull from upstream. Reconcile is a file-level diff-and-copy, never a history operation.

## Steps

**1. Fetch and diff.**

```sh
git fetch upstream
git diff --name-status upstream/main HEAD -- PROTOCOL.md AGENTS.md 'skills/*.md' '*/_template.md'
```

**2. Categorize** each result:

The diff is written `upstream/main HEAD`, so the letters are **from the template's point of view**. `D` does not mean anything was deleted — read the table, not the letter.

| Status | What it actually means | Category |
|---|---|---|
| `M <path>` | content differs between template and vault | **Drifted** — needs a direction decision |
| `D <path>` | exists **upstream**, missing in your vault — the template added it | **Behind** — pull it |
| `A <path>` | exists **in your vault**, missing upstream — you added it | **Ahead** — promote, keep, or delete |

If that mapping ever looks wrong, confirm it directly rather than guessing:

```sh
git ls-tree -r --name-only upstream/main | sort > /tmp/up.txt
git ls-tree -r --name-only HEAD | sort > /tmp/local.txt
comm -23 /tmp/up.txt /tmp/local.txt   # upstream only  -> Behind
comm -13 /tmp/up.txt /tmp/local.txt   # vault only     -> Ahead
```

**2a. Discount expected drift.** The `upstream:` line in `PROTOCOL.md` frontmatter carries the version your vault was created at, so it lags behind the template as the protocol moves. That is expected and is not drift. A `PROTOCOL.md` whose only difference is that line is **in sync** — mention the version gap in one line, then move on. Compare with the line filtered out:

```sh
diff <(git show upstream/main:PROTOCOL.md) <(sed '/^upstream: /d' PROTOCOL.md)
```

**3. Surface everything at once** before resolving anything. Counts per category, one line per file. The user sees the whole picture first, then decides.

**4. Resolve per file**, asking each time:

- **Behind** — *"Pull `<file>` from the template?"* Default: pull. `skip` keeps your version and accepts that the drift recurs next run.
- **Drifted** — show what differs, then ask which direction wins. Never guess. A drifted `PROTOCOL.md` usually means the template gained a section you want and also lacks a local rule you need; the answer is often a merge by hand, not either whole file.
- **Ahead** — surface only, never auto-resolve. Ask: promote it upstream, keep it local, or delete. **Ahead is the normal state for a vault that is dogfooding the protocol** — it is where new protocol features get proven before they go into the template. Do not treat it as an error.

**5. Report and commit.** One commit per resolved file, following this vault's commit message convention. Never commit a resolution the user did not approve.

**6. Record the version synced to.** Write the upstream tag you reconciled against
into `.synesis-version` at the repo root, and commit it. That file is what `hello`
reads to decide whether to nudge, and nothing else writes it — if reconcile skips
this, every future briefing reports the vault as behind when it is not.

Only write it when the run actually finished. A reconcile the user abandoned
halfway has not synced to anything.

`.synesis-version` is tracked, not ignored. Committing it is how other clones and
other machines know where the vault stands.

## Notes

- Run after any upstream version bump, and before promoting local protocol work into the template.
- `PROTOCOL.md` frontmatter carries `upstream: <repo>@<version>` for awareness. Reconcile does not read or update it automatically — the version there is a label, not a lockfile.
- If the diff is empty, say so in one line. A clean reconcile is the common case and does not need a report.
- **Parity means the protocol matches, not that every file matches.** A vault at parity still differs from the template in its README, its `tools/` index, its licence and all of its content — that is the design, not drift left unfinished. Restoring parity by hand, outside this skill, is where that distinction gets lost: work file by file against the scope table above, never by making the two trees identical.
