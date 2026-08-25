---
name: archive
description: Mark a record or convention as archived — removes it from active briefings
triggers:
  - archive verb
---

# Archive

When triggered, mark a record or convention as no longer active without deleting it.

**Archiving means it stopped mattering.** It is not how you record a decision. A proposal the team deliberately turned down goes through `decide` and becomes `status: rejected`, which stays visible — archiving it would hide the answer exactly where the next person would look for it. Archive a proposal only when nobody ever answered it and nobody intends to.

## Steps

1. **Identify the target.** The user specifies a file by name or path (e.g. `archive conventions/old-deploy-process`).

2. **Confirm.** Show the file's title/name and ask the user to confirm before modifying.

3. **Set the flag.** Add `archived: true` to the file's frontmatter. Do not move the file or change its location.

4. **Re-run `weave`.** Other files may still link to this one. Regenerating drops those links, since weave never links to archived files.

5. **Commit and push.** Commit the flag and any weave changes together, then push. A vault change that stays local is invisible to the rest of the team.

## Effect

- The `hello` skill skips archived files when listing conventions and recent decisions.
- The `status` skill skips archived files.
- The `lint` skill skips archived files from stale-knowledge checks.
- The `search` skill still finds archived files — they're historical, not deleted.
- The `weave` skill neither generates a `## Related` block for archived files nor links to them. **Re-run `weave` after archiving** so inbound links from active files drop away on regeneration.

## Reversing

Remove the `archived: true` line from frontmatter to restore the file to active status.
