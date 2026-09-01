---
name: lint
description: Check vault hygiene — stale knowledge, broken links, missing attribution
triggers:
  - lint verb
---

# Lint

When triggered, scan the vault for hygiene issues. Report findings — do not auto-fix.

## General rules

- **Skip `_template.md` files** in all checks. Templates have intentionally empty frontmatter.
- **Skip `[[wikilinks]]` inside code blocks and inline code.** Fenced code blocks (triple backticks) and inline code (single backticks) contain examples, not live links.
- **Skip protocol infrastructure files** (`PROTOCOL.md`, `AGENTS.md`) from stale-knowledge and attribution checks. These are protocol docs, not team content.
- **Skip archived files** (frontmatter `archived: true`) from stale-knowledge checks. They're historical — staleness is expected.

## Checks

### 1. Stale knowledge
Scan `records/` and `conventions/` for files where `last-verified` in frontmatter is older than `stale-days` (defined in `PROTOCOL.md` frontmatter, default 90 days). Report each stale file with its last-verified date and how many days overdue.

### 2. Broken links
Scan all markdown files for `[[wikilinks]]` in body text (not inside code blocks or inline code) and `superseded-by` frontmatter values. Check that each target resolves to an existing file (with or without `.md` extension). Report any broken links with the source file and target.

### 3. Missing attribution
Scan `records/` for files missing the `decided-by` frontmatter field (empty array or absent). Report each unattributed record.

**Decisions only.** Skip records with `type: note` — a note records what was found, not what was chosen, so it has nobody to attribute. Also skip `status: proposed`: an open question has not been decided yet, and `decided-by` is filled in when `decide` answers it.

**`rejected` records are not skipped.** A no is a decision and has a decider. An unattributed rejection is the same defect as an unattributed acceptance.

### 4. Orphaned profiles
Scan `people/` profiles and check each `email` field against recent git authors (`git log --format='%ae' --since='6 months ago'`). Report profiles where the email doesn't appear in recent git history. Dedupe the author list yourself rather than piping through `sort -u` — a pipe falls outside the vault's `Bash(git:*)` grant and would prompt mid-lint.

### 5. Empty templates
Scan `records/`, `people/`, and `conventions/` for files that are still identical to (or trivially different from) their `_template.md`. Report any unfilled templates.

### 6. Weave block integrity
Check the derived `## Related` blocks in `records/` and `conventions/` (see Record linking in `PROTOCOL.md`). Report: links that are not reciprocated, unpaired or duplicated `weave:start` / `weave:end` markers, empty weave blocks (omit the section instead), and any `## Related` heading without markers (hand-written links belong in the body, not in derived space).

### 7. Unanswered proposals
Records with `status: proposed` whose `date` is older than `stale-days`. Report each with its age and who is listed in `consulted`.

An open question is only useful while someone is still looking at it. Past the threshold it is either still live — answer it with `decide`, yes or no — or it stopped mattering, in which case `archive` it. A proposal that has been open for a year is not an open question; it is litter.

**Do not suggest `archive` for a question the team actually turned down.** That is `decide` with `status: rejected`, and it stays visible. Archiving is for questions nobody ever answered.

Report as: `records/2026-08-20-cache-strategy.md — proposed 118 days ago, consulted [MK]`.

### 8. Vault references in template files
Template-scope files — `PROTOCOL.md`, `AGENTS.md`, `skills/*.md`, `*/_template.md` — ship to every vault created from this template. They must never reference **this** vault's content.

Scan them for `[[wikilinks]]` pointing at `records/`, `conventions/` or `people/`, and **include links inside code blocks and inline code** — this is the one check where the skip-code rule in General rules does not apply, because a backticked example is exactly how these get written.

Flag any such link **that resolves to a file in this vault**. The logic inverts check 2:

- **Resolves here** → written against local content, and will dangle in a fresh vault. Report it.
- **Resolves nowhere** → an illustrative placeholder. Probably correct — but read the next rule before leaving it.

Report as: `skills/weave.md — [[records/2026-08-22-decision]] resolves locally; template files need a placeholder`.

Fix by replacing the link with a placeholder that names nothing real, or by rewriting the sentence to drop the link.

**Resolving nowhere is not sufficient, and in a template repo it proves nothing.** A template's `records/`, `conventions/` and `people/` are empty by design, so *every* link resolves nowhere and this check passes no matter how bad the placeholder is. The defect only appears downstream, in whichever vault happens to create a file with that name — and by then it has shipped everywhere.

So the real test is whether the target is **implausible as a filename any vault would create**:

| placeholder | verdict |
|---|---|
| `records/2026-08-20-api-redesign` | fine — a dated slug nobody will reproduce |
| `conventions/example-workflow` | fine — nobody names a convention that |
| `conventions/branching` | **bad** — many teams will have exactly this |
| `people/sarah` | **bad** — someone will hire a Sarah |

Judge the name, not the current filesystem. A plausible name that happens not to exist yet is a defect waiting for its vault.

### 9. Lifecycle field integrity

`status` records what a decision answered. `superseded-by` records whether it is still current. They are independent, and each of these breaks that separation. Scan `records/` and report any violation:

| # | Invariant | Why |
|---|---|---|
| 1 | `status: superseded` appears nowhere | Removed at v1.0 — supersession is a pointer, not a state. A file still carrying it predates the change |
| 2 | `status: active` appears nowhere | Renamed to `accepted` at v1.0 |
| 3 | `type: note` ⇒ no `status` field | Nothing was proposed and nothing was accepted |
| 4 | decisions ⇒ `status` is one of `proposed`, `accepted`, `rejected` | No other value is valid |
| 5 | `status: proposed` ⇒ empty `decided-by` **and** no `superseded-by` | A proposal is answered or archived, never superseded |
| 6 | `status: accepted` or `rejected` ⇒ `decided-by` non-empty | A no has a decider too (this is check 3 restated for rejections) |

Report as: `records/2026-08-20-cache-strategy.md — type: note carries status: accepted (invariant 3)`.

Invariants 1 and 2 are migration residue: if either fires, a record was written against the old contract and needs converting, not patching.

### 10. Dead permission rules

Claude Code checks file permissions against `Edit(path)` and `Read(path)` rules **only**. A path rule written for `Write`, `NotebookEdit`, `Glob` or `MultiEdit` is accepted and then never consulted — it looks like a guard and enforces nothing, and Claude Code prints a warning at every session start until it is fixed.

Read `.claude/settings.json` and report any entry in `allow`, `deny` or `ask` of the form `Write(...)`, `NotebookEdit(...)`, `Glob(...)` or `MultiEdit(...)`.

Report as: `.claude/settings.json — deny rule Write(skills/**) is never consulted; use Edit(skills/**)`.

**A bare tool name is not this defect.** `"Write"` or `"Glob"` with no parentheses matches at the tool level and works as written — the allow list is expected to contain them. Only a rule carrying a path is dead.

### 11. Passed deadlines

Scan `records/` and `conventions/` (excluding `archived: true`) for a frontmatter `deadline` in the past. A passed deadline means the event it names has happened: the file needs its date moved, the field removed because the event was handled, or the record superseded or archived. Report it — do not fix it. Compare against `date +%F`, never an inferred date.

Report as: `conventions/code-signing.md — deadline 2027-04-16 passed 12 days ago`.

## Output format

Report findings grouped by check, with file paths and a one-line description of each issue. If a check finds nothing, say so in one line. Example:

```
Stale knowledge:
  conventions/git.md — last verified 2026-03-15 (160 days ago)

Broken links:
  records/2026-08-18-auth-decision.md — [[people/example-person]] not found

Missing attribution:
  records/2026-07-01-api-redesign.md — no decided-by

No orphaned profiles found.
No empty templates found.
```

