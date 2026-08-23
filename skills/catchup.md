---
name: catchup
description: What changed in the vault since your last session
triggers:
  - catchup verb
---

# Catchup

When triggered, summarize what changed in the vault since the current user's last session.

## Steps

1. **Identify the user.** Read `git config user.email` and find their profile in `people/`.

2. **Find the baseline.** Read the `last-seen` field from the user's people profile. If no `last-seen` exists, fall back to asking "since when?" or default to the last 7 days.

3. **Query git log.** Run `git log --since='{last-seen}' --name-status --pretty=format:'%h %s (%an, %ai)'` on the vault repo.

4. **Summarize changes.** Group by type:
   - **New records** — decisions or knowledge added since last seen
   - **New or updated conventions** — standards that changed
   - **People changes** — new profiles, updated roles
   - **Skill changes** — new or modified agent capabilities

5. **Update last-seen.** Set `last-seen` in the user's people profile to today's date. Commit the update.

## Output

Keep it scannable. For each changed file: one line with the filename, what changed (added/modified), and who changed it. If nothing changed, say so directly.

## Notes

- This is shorter than `hello` — no full team roster, no convention listing, no verb reference.
- Focus on what's *new*, not what exists.
- Archived files that were archived since last-seen should still appear in the summary — the user needs to know they were archived.
