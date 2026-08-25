---
name: update
description: Re-verify a convention or record and bump its last-verified date
triggers:
  - update verb
---

# Update

When triggered, re-verify a convention or record to confirm it's still accurate.

## Steps

1. **Identify the target.** The user specifies a file by name or path (e.g. `update conventions/git-workflow`). If no target is specified, list all items flagged as stale by the lint skill and let the user pick.

2. **Show the content.** Display the file's current content so the user can review it.

3. **Ask for confirmation.** "Is this still accurate?" The user may:
   - **Confirm** — content is still correct as-is.
   - **Edit** — user provides corrections. Apply them. **Conventions and people profiles only** — they are living documents. Records are append-only and cannot be edited (see Record immutability in `PROTOCOL.md`); if the user asks to edit a record, offer Supersede instead.
   - **Supersede** — the convention or decision is no longer valid. Trigger the `decide` skill to file a replacement, then set `superseded-by` on this file. Leave `status` alone: what it decided has not changed, only whether it is current.

4. **Bump the date.** Set `last-verified` to today's date in the file's frontmatter.

5. **Commit.** Commit the change with a descriptive message.

## Notes

- This is the counterpart to `lint` — lint flags stale items, update resolves them.
- Can be run on any file with a `last-verified` field, not just stale ones.
- On a record, the only outcomes are Confirm (bump `last-verified`) and Supersede. Bumping the date is a frontmatter change, which immutability allows; changing the body is not.
