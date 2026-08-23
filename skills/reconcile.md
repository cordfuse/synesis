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
| `tools/lint.ts` | implements the lint skill |
| `*/_template.md` | frontmatter shapes |
| `AGENTS.md` | agent entry point |

Explicitly **out of scope**: `records/`, `conventions/`, `people/`, `attachments/`, `README.md`, `CLAUDE.md`, and any other agent instruction file. That content is the team's, not the template's. `README.md` and `CLAUDE.md` are expected to diverge immediately and permanently — flagging them every run would train the user to ignore the report.

## Setup

Vaults are created with GitHub's "Use this template", so there is **no fork relationship and no upstream remote by default**. Add one if missing:

```sh
git remote add upstream <template-repo-url>
git fetch upstream
```

The two repos have unrelated histories — a template copy starts with a fresh commit. `git diff` works fine across them; `git merge-base` returns nothing. Never attempt a merge, rebase, or pull from upstream. Reconcile is a file-level diff-and-copy, never a history operation.

## Steps

**1. Fetch and diff.**

```sh
git fetch upstream
git diff --name-status upstream/main HEAD -- PROTOCOL.md AGENTS.md 'skills/*.md' tools/lint.ts '*/_template.md'
```

**2. Categorize** each result:

| Status | Meaning | Category |
|---|---|---|
| `M` | content differs | **Drifted** — needs a direction decision |
| present upstream, absent locally | template added it | **Behind** — upstream has something you don't |
| present locally, absent upstream | you added it | **Ahead** — you have something the template doesn't |

**2a. Discount expected drift.** The vault's `PROTOCOL.md` carries an `upstream:` frontmatter line that the template cannot have — the template *is* the upstream. A `PROTOCOL.md` whose only difference is that line is **in sync**; do not report it. Compare with the line filtered out:

```sh
diff <(git show upstream/main:PROTOCOL.md) <(sed '/^upstream: /d' PROTOCOL.md)
```

**3. Surface everything at once** before resolving anything. Counts per category, one line per file. The user sees the whole picture first, then decides.

**4. Resolve per file**, asking each time:

- **Behind** — *"Pull `<file>` from the template?"* Default: pull. `skip` keeps your version and accepts that the drift recurs next run.
- **Drifted** — show what differs, then ask which direction wins. Never guess. A drifted `PROTOCOL.md` usually means the template gained a section you want and also lacks a local rule you need; the answer is often a merge by hand, not either whole file.
- **Ahead** — surface only, never auto-resolve. Ask: promote it upstream, keep it local, or delete. **Ahead is the normal state for a vault that is dogfooding the protocol** — it is where new protocol features get proven before they go into the template. Do not treat it as an error.

**5. Report and commit.** One commit per resolved file, following this vault's commit message convention. Never commit a resolution the user did not approve.

## Notes

- Run after any upstream version bump, and before promoting local protocol work into the template.
- `PROTOCOL.md` frontmatter carries `upstream: <repo>@<version>` for awareness. Reconcile does not read or update it automatically — the version there is a label, not a lockfile.
- If the diff is empty, say so in one line. A clean reconcile is the common case and does not need a report.
