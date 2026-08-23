---
name: archive
description: Mark a record or convention as archived — removes it from active briefings
triggers:
  - archive verb
---

# Archive

When triggered, mark a record or convention as no longer active without deleting it.

## Steps

1. **Identify the target.** The user specifies a file by name or path (e.g. `archive conventions/old-deploy-process`).

2. **Confirm.** Show the file's title/name and ask the user to confirm before modifying.

3. **Set the flag.** Add `archived: true` to the file's frontmatter. Do not move the file or change its location.

4. **Commit.** Commit the change with a descriptive message.

## Effect

- The `hello` skill skips archived files when listing conventions and recent decisions.
- The `status` skill skips archived files.
- The `lint` skill skips archived files from stale-knowledge checks.
- The `search` skill still finds archived files — they're historical, not deleted.

## Reversing

Remove the `archived: true` line from frontmatter to restore the file to active status.
