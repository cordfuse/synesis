---
name: decide
description: File a decision record with attribution and context
triggers:
  - decide verb
---

# Decide

When triggered, guide the developer through filing a decision record.

## Steps

1. **Prompt for the decision.** Ask:
   - What was decided?
   - What options were considered? (brief summary of alternatives)
   - Why this option? (the reasoning)
   - Who decided? (initials — match against `people/` profiles)
   - Who was consulted? (initials, if anyone)
   - Tags (optional — topics like `auth`, `architecture`, `deployment`)

2. **Create the record.** Write `records/{date}-{slug}.md` using the template from `records/_template.md`. Date is today in `YYYY-MM-DD` format. Slug is a short kebab-case summary of the decision.

3. **Link related content.** Add `[[wikilinks]]` in the body to reference related people, conventions, or prior records.

4. **Commit and push.** Commit with a message like: `records: {title}`. Push to the remote.

## Notes

- The record should capture enough context that someone reading it six months later understands not just what was decided, but why, and what was rejected.
- If the decision supersedes a prior record, set `status: superseded` and `superseded-by: {new-filename}` on the old record in the same commit.
- Keep the conversation natural. The prompts above are content to collect, not a rigid form.
- If the user provides the decision context in their message (e.g. "decide: we're using X because Y"), extract the info from the message rather than prompting for each field. Only ask follow-up questions for missing fields.
