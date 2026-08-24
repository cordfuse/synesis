---
name: convention
description: Write down how the team does something, as a convention file
triggers:
  - convention verb
  - write this down
  - document how we do
  - add a convention
---

# Convention

When triggered, capture a team standard as a file in `conventions/`. The counterpart to `decide`: `decide` records **what was chosen once**, `convention` records **how the team works ongoing**.

The user describes the practice in their own words. **They never write frontmatter** — you write the file.

## Steps

1. **Collect the practice.** Extract what you can from the user's message and ask only for what's missing:
   - What's the practice? (the rule itself, and any specifics — commands, formats, thresholds)
   - What's it called? (becomes `name`, and the kebab-case filename)
   - Topics it covers (becomes `tags`)
   - Any exceptions, or per-repo/per-machine scoping

   If they said it in a sentence — *"convention: we squash merge everything except release branches"* — take it and confirm the gaps. Don't re-interview them for what they already told you.

2. **Check for an existing home first.** Search `conventions/` for a file that already covers this ground. If one exists, **update it** rather than creating a near-duplicate, and bump its `last-verified`. Two conventions covering the same practice will disagree eventually, and nobody will know which is current.

3. **Write the file.** `conventions/{slug}.md`, kebab-case, using `conventions/_template.md`:

   ```yaml
   ---
   name: Human-readable name
   last-verified: YYYY-MM-DD    # today
   tags: [topic, topic]
   ---
   ```

   Then the practice itself. Lead with the rule in one line, then specifics — commands, tables, examples. Write it so an agent can act on it, not just a human read it: concrete commands beat prose descriptions of commands.

4. **Link related content.** Add `[[wikilinks]]` in body prose where a sentence genuinely explains a connection. Do **not** hand-write a `## Related` block — that block is derived and belongs to the `weave` skill. Run `weave` after filing to generate it.

5. **Commit and push.** `conventions: add {slug}` (or `conventions: update {slug}`). Push to the remote.

## Notes

- Conventions are **living documents**, unlike records. They describe how the team works *now*. Edit them in place and bump `last-verified` — there is no immutability rule and no superseding.
- Keep a practice in the file that owns the task it belongs to. A rule duplicated across two conventions goes stale in one of them.
- Scope with tags when a convention only applies somewhere: machine tags (`[cachy]`, `[mac]`), agent tags (`[claude-code]`, `[codex]`). See Tag-based scoping in `PROTOCOL.md`.
- Vault conventions govern the vault only. A convention about how project repos work is fine to record here, but the agent must not apply vault conventions to a project repo — see Scope boundary in `PROTOCOL.md`.
- If the user is deciding something rather than describing standing practice, use `decide` instead. "We evaluated three options and picked Clerk" is a record. "All PRs need one approval" is a convention.
