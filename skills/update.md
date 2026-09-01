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

5. **Commit and push.** Commit the change with a descriptive message, then push.

## Deadlines

`update` also resolves a deadline that has passed or is approaching — the ones `lint` check 11 flags and `hello` surfaces. Re-verify the underlying fact first, then either move `deadline` to the new date or remove the field because the event has been handled. Both are frontmatter changes, so both are allowed on a record. If the file itself is finished rather than the date moved, recommend supersede or `archive` instead — a passed deadline on a file nobody will act on again is noise every run.

## Notes

- This is the counterpart to `lint` — lint flags stale items, update resolves them.
- Can be run on any file with a `last-verified` field, not just stale ones.
- On a record, the only outcomes are Confirm (bump `last-verified`) and Supersede. Bumping the date is a frontmatter change, which immutability allows; changing the body is not.
