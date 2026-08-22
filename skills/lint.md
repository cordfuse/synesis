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
- **Skip protocol infrastructure files** (`PROTOCOL.md`, `AGENTS.md`, `VERBS.md`) from stale-knowledge and attribution checks. These are protocol docs, not team content.

## Checks

### 1. Stale knowledge
Scan `records/` and `conventions/` for files where `last-verified` in frontmatter is older than `stale-days` (defined in `PROTOCOL.md` frontmatter, default 90 days). Report each stale file with its last-verified date and how many days overdue.

### 2. Broken links
Scan all markdown files for `[[wikilinks]]` in body text (not inside code blocks or inline code) and `superseded-by` frontmatter values. Check that each target resolves to an existing file (with or without `.md` extension). Report any broken links with the source file and target.

### 3. Missing attribution
Scan `records/` for files missing the `decided-by` frontmatter field (empty array or absent). Report each unattributed record.

### 4. Orphaned profiles
Scan `people/` profiles and check each `email` field against recent git authors (`git log --format='%ae' --since='6 months ago' | sort -u`). Report profiles where the email doesn't appear in recent git history.

### 5. Empty templates
Scan `records/`, `people/`, and `conventions/` for files that are still identical to (or trivially different from) their `_template.md`. Report any unfilled templates.

## Output format

Report findings grouped by check, with file paths and a one-line description of each issue. If a check finds nothing, say so in one line. Example:

```
Stale knowledge:
  conventions/git.md — last verified 2026-03-15 (160 days ago)

Broken links:
  records/2026-08-18-auth-decision.md — [[people/mike]] not found

Missing attribution:
  records/2026-07-01-api-redesign.md — no decided-by

No orphaned profiles found.
No empty templates found.
```
