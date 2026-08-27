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
| `.claude/settings.json` | the permission backstop |
| `.codex/config.toml` | the Codex sandbox and approval policy |
| `.github/copilot-instructions.md` | Copilot entry point |
| `GEMINI.md` | Antigravity entry point |
| `opencode.json` | OpenCode entry point |

Explicitly **out of scope**: `records/`, `conventions/`, `people/`, `attachments/`, `tools/`, `LICENSE`, `PLAN.md`, `EXAMPLE.md`, and exactly two instruction files — `README.md` and `CLAUDE.md`. That content is the team's, not the template's, and those two are expected to diverge immediately and permanently — flagging them every run would train the user to ignore the report.

**Name the exclusions, never a category.** "Any agent instruction file" reads as a tidy rule and is not one: it puts `AGENTS.md` in this list and in the scope table above at the same time, and it silently excludes the harness shims — `GEMINI.md`, `opencode.json`, `.github/copilot-instructions.md` — which no team edits and which `settings.json` denies editing outright. A file the protocol forbids you to change is not the team's content, and leaving it unscoped means a shim can go stale for good: the fix lands in the template, no run ever mentions it, and the vault answers a verb as though it were a greeting. `CLAUDE.md` earns its place here on evidence rather than category — vaults really do carry a parent declaration and local precedence rules in it.

`PLAN.md` and `EXAMPLE.md` start as the template's own files. `PLAN.md` is the framework's execution plan, not shipped knowledge — if your vault still has it, delete it rather than keeping it in sync. `EXAMPLE.md` is the same until a team **rewrites** it — its own stack, its own people, its own week of work. At that point the team owns it and it is team content like any record. Reconcile never syncs it and never offers to delete it. Judge by whether the content is still the template's, not by whether the filename is present.

**Five files are reported but never pulled** — `.claude/settings.json`, `.codex/config.toml`, `GEMINI.md`, `opencode.json` and `.github/copilot-instructions.md`. They are in scope so that drift is *visible*; an agent cannot resolve them. The first two define what the session doing the writing is allowed to do — one its tool permissions, the other its sandbox and approval policy. The other three are the instructions that session is following. Every route by which an agent would rewrite either kind is refused, `git checkout` included. That guard is working as intended, and widening it to make this skill more convenient would defeat the only thing it protects. Show the diff, name the lines that differ, and let the developer apply them. Do not retry through another mechanism, and do not report any of the five as resolved.

Expect this section of the report to be non-empty and to stay that way until someone acts on it. That is the intended cost: a shim that is one line behind the template is invisible until something names it, and the failure it produces — a verb answered as a greeting — reads as the vault being useless rather than unwired.

`LICENSE` never comes down, and the reason is worth stating plainly: the template is a public MIT repo, and most vaults built from it are not. Copying its licence onto a private vault puts the template author's copyright line on the team's own conventions, decisions, people profiles and whatever else the vault holds, and offers all of it under MIT. If a vault needs a licence it writes its own.

## Setup

Your vault inherits an `upstream:` field in `PROTOCOL.md` frontmatter naming the template repo it came from. That is the one thing about the relationship worth storing: `hello` derives the upstream remote from it. It carries no version — what protocol the vault holds is `version:`, and what it started with is in the vault's git history.

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
git diff --name-status upstream/main HEAD -- PROTOCOL.md AGENTS.md 'skills/*.md' '*/_template.md' .claude/settings.json .codex/config.toml GEMINI.md opencode.json .github/copilot-instructions.md
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
git ls-tree -r --name-only upstream/main
git ls-tree -r --name-only HEAD
```

Compare the two listings yourself: a path in the first and not the second is
**Behind**, one in the second and not the first is **Ahead**. Do not pipe these
through `sort`/`comm` into `/tmp` — that needs a shell grant beyond `Bash(git:*)`
and writes scratch files outside the vault, for a comparison of a few dozen paths
you can read directly.

**2a. `PROTOCOL.md` drift is real drift.** There is no expected-difference line to discount. `upstream:` names only the repo, which does not change as the protocol moves, and `version:` differing means the vault genuinely holds an older protocol. Resolve it like any other drifted file.

**3. Surface everything at once** before resolving anything. Counts per category, one line per file. The user sees the whole picture first, then decides.

**4. Resolve per file**, asking each time:

- **Behind** — *"Pull `<file>` from the template?"* Default: pull. `skip` keeps your version and accepts that the drift recurs next run.
- **Drifted** — show what differs, then ask which direction wins. Never guess. A drifted `PROTOCOL.md` usually means the template gained a section you want and also lacks a local rule you need; the answer is often a merge by hand, not either whole file.
- **Ahead** — surface only, never auto-resolve. Ask: promote it upstream, keep it local, or delete. **Ahead is the normal state for a vault that is dogfooding the protocol** — it is where new protocol features get proven before they go into the template. Do not treat it as an error.

**5. Report, commit and push.** One commit per resolved file, following this vault's commit message convention. Never commit a resolution the user did not approve. Push when the run finishes — a reconciled vault that never leaves the machine leaves every other clone still drifted.

**6. Nothing else to record.** Pulling `PROTOCOL.md` updates the vault's `version:`
by itself, and that is what `hello` reads to decide whether to nudge. There is no
separate version file to write — a number kept in two places is a number free to
disagree with itself.

A vault that skips `PROTOCOL.md` during a run keeps nudging afterwards. That is
correct: it is not fully synced.

## Notes

- Run after any upstream version bump, and before promoting local protocol work into the template.
- `PROTOCOL.md` frontmatter carries `upstream: <repo>`. Reconcile never rewrites it: the repo a vault came from does not change, and a vault whose remote moved should have that edited by hand.
- If the diff is empty, say so in one line. A clean reconcile is the common case and does not need a report.
- **Parity means the protocol matches, not that every file matches.** A vault at parity still differs from the template in its README, its `tools/` index, its licence and all of its content — that is the design, not drift left unfinished. Restoring parity by hand, outside this skill, is where that distinction gets lost: work file by file against the scope table above, never by making the two trees identical.
