---
name: weave
description: Backfill [[wikilinks]] between related files so the vault becomes a navigable graph
triggers:
  - weave verb
  - link my records
  - cross-link the vault
  - build the graph
---

# Weave

When triggered, add `[[wikilink]]` cross-links between related files so the flat vault becomes a navigable graph. Links are collected in a derived `## Related` block at the end of each file.

**Only the `## Related` block is ever written.** Record bodies are immutable (see Record immutability in `PROTOCOL.md`). Frontmatter is never touched.

## Scope

Weave `records/` and `conventions/`.

Skip:
- `_template.md` in every directory
- files with `archived: true` in frontmatter — as a **target**, never link *to* one; and as a **source**, *remove* any `## Related` block they still carry rather than leaving it frozen. Skipping regeneration is not enough: a stale block on an archived file keeps pointing at records that no longer point back, which reads as a one-way link forever. The block is derived, so deleting it loses nothing — un-archive the file and the next weave rebuilds it.
- `people/` profiles — the "Owns" section is hand-maintained, and every file would link to the same one or two people

## Steps

1. **Read the corpus.** Load frontmatter and body of every in-scope file.

2. **Find relationships.** For each file, identify high-confidence links only (see below).

3. **Rank and cap.** At most **5** links per file. If more qualify, keep the strongest. The cap is deliberate — a Related block that lists everything is an index, not a graph.

4. **Make links bidirectional.** If A links to B, B lists A. Apply the cap after reciprocals are added; if a reciprocal would push a file over 5, keep it anyway — reciprocity wins over the cap.

5. **Write the blocks.** Replace the existing `<!-- weave:start -->` … `<!-- weave:end -->` region, or append a fresh `## Related` section at the end of the file if none exists. Never write a block with no links — omit the section entirely.

6. **Report, then commit.** Summarize: files scanned, blocks written, links added, links removed since last run. Commit as one batch: `weave: cross-link records and conventions`. Do not push unless asked.

## What counts as a high-confidence link

Link when there is a **real relationship**:

- **Named subject** — the file names the other file's topic explicitly (`shell-scripts` referring to fish functions)
- **Supersession chain** — `superseded-by` in either direction
- **Decision to convention** — a record decided the rule a convention documents
- **Dependency** — one cannot be followed without the other (SSH aliases and clone rules)
- **Shared narrow tag** — `[npm]`, `[ssh]`, `[ports]`

Do **not** link on:

- **Broad tags alone** — `[all]`, `[infrastructure]`, `[ai]` are not relationships
- **Topical adjacency** — both files mention git, therefore they are related. They are not.
- **Vault membership** — everything is about how the team works. That is not a link.

When uncertain, do not link. A sparse accurate graph beats a dense noisy one.

## Format

The block goes at the **end of the file**, after all authored content:

```markdown
## Related

<!-- weave:start -->
- [[conventions/ssh-multi-account]] — clone rules depend on the host aliases
- [[records/2026-08-22-template-repo-model]] — decided this approach
<!-- weave:end -->
```

Rules:

- Path form, no `.md` extension: `[[conventions/git-workflow]]`, `[[records/2026-08-20-api-redesign]]`
- One line per link, em-dash, then a short phrase saying **why** the two are related — not what the target is about
- Alphabetical within the block, so regeneration is stable and diffs stay small
- The `weave:start` / `weave:end` markers are required. They are how weave knows what it owns.

## Regenerability

The block is derived and disposable. Delete every `## Related` section in the vault, re-run `weave`, and you get **the same set of links** — the rules pin down which files link, the alphabetical order, and the cap.

**They do not pin down the wording after the em-dash.** That phrase is free prose, so a naive regeneration rewrites all of it and churns every woven file at once. Two rules keep that from happening:

- **Preserve existing descriptions.** When regenerating, a link that was already there keeps the phrase it already had. Only genuinely new links get newly written prose.
- **Rewrite a description only when the relationship itself changed** — or when the user asks for it directly.

With those, weave is idempotent in practice: run it twice in a row and the second run produces no diff. A weave pass that touches files whose links did not change is a bug, not a refresh.

If a link is wrong, fix the rule here — do not hand-edit the block, it will be overwritten on the next run.

## Notes

- Weave feeds `lint` check 2 (broken links). Run `lint` after a weave pass to verify every link resolves.
- Links in body prose are authored content. Weave never removes, moves, or dedupes them — a file may legitimately reference the same target in both places.
- Weave is idempotent, given the preservation rule above. Running it twice in a row must produce no diff — if it does, the descriptions are being regenerated when they should have been kept.
