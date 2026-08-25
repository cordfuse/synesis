---
name: decide
description: File a decision record with attribution and context
triggers:
  - decide verb
---

# Decide

When triggered, resolve an open proposal — or, if there is none, file the decision directly. A decision may be a no; `decide` files that too.

## Resolve or create

**First, look for an open proposal.** Search `records/` for `status: proposed` covering this question.

- **Found one** → resolve it. Write `## Decision` and `## Consequences` into that record, set `decided-by`, set `last-verified` to today, and flip `status` to `accepted` — or to `rejected` if the answer was no. Do not open a second record; the question and its answer belong in one file, and the git history shows it becoming one. From this point the record is frozen — normal immutability applies.
- **Found none** → create the record as below. This is the common path when the decision was already made before anyone thought to write it down.

## Answering no

A rejection is a decision and is filed exactly like one: same file, `decided-by` set, `## Decision` explaining what was turned down and on what grounds. The only difference is `status: rejected`.

**Do not `archive` a proposal to record a no.** Archiving means the question stopped mattering before anyone answered it. A rejection is an answer, and it stays visible because its whole value is stopping the same idea returning in six months — which is exactly when someone will look for it.

If a proposal exists but the decision went somewhere its options never covered, say so in `## Decision` rather than quietly rewriting the options. What the team considered and rejected is the record's most valuable half.

## Steps

1. **Prompt for the decision.** Ask:
   - What was decided?
   - What options were considered? (brief summary of alternatives)
   - Why this option? (the reasoning)
   - Who decided? (initials — match against `people/` profiles)
   - Who was consulted? (initials, if anyone)
   - Tags (optional — topics like `auth`, `architecture`, `deployment`)

2. **Create the record.** Write `records/{date}-{slug}.md` using the template from `records/_template.md`. Date is today in `YYYY-MM-DD` format. Slug is a short kebab-case summary of the decision.

3. **Link related content.** Add `[[wikilinks]]` in the body prose where a sentence genuinely explains a connection. Do **not** hand-write a `## Related` block — that block is derived and belongs to the `weave` skill. Run `weave` after filing to generate it (see Record linking in `PROTOCOL.md`).

4. **Commit and push.** Commit with a message like: `records: {title}`. Push to the remote.

## Notes

- The record should capture enough context that someone reading it six months later understands not just what was decided, but why, and what was rejected.
- If the decision supersedes a prior record, set `superseded-by: {new-filename}` on the old record in the same commit. **Leave its `status` alone** — what that record decided has not changed, only whether it is still current. A reversed rejection stays `rejected` and gains a pointer.
- Keep the conversation natural. The prompts above are content to collect, not a rigid form.
- If the user provides the decision context in their message (e.g. "decide: we're using X because Y"), extract the info from the message rather than prompting for each field. Only ask follow-up questions for missing fields.
- If nothing was actually chosen — a finding, a postmortem, a measurement — use `note` instead. Records that document what was learned do not need attribution or a decision.
- If the question is still open and nobody has chosen yet, use `propose` instead — it files the question so the reasoning is captured while the options are still live.
