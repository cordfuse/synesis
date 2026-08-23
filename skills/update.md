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
   - **Edit** — user provides corrections. Apply them.
   - **Supersede** — the convention or decision is no longer valid. Trigger the `decide` skill to file a replacement, then mark this file `superseded`.

4. **Bump the date.** Set `last-verified` to today's date in the file's frontmatter.

5. **Commit.** Commit the change with a descriptive message.

## Notes

- This is the counterpart to `lint` — lint flags stale items, update resolves them.
- Can be run on any file with a `last-verified` field, not just stale ones.
