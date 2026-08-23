---
name: status
description: Summary of active work, ownership, and recent activity
triggers:
  - status verb
---

# Status

When triggered, report what's in flight and who's working on what.

## Steps

1. **Recent activity.** List the last 5-10 records by `date` (most recent first), skipping records with `archived: true`. For each: title, date, decided-by, status.

2. **Active handoffs.** Find records tagged `handoff` that are not `superseded`. For each: what's being handed off, from whom, to whom, and current state.

3. **Ownership map.** Scan `people/` profiles and summarize the "Owns" section from each. Show who owns what areas.

4. **Stale items.** Check `records/` and `conventions/` (excluding `archived: true`) for anything with `last-verified` older than `stale-days`. List any stale items as a heads-up.

## Notes

- This is a shorter output than `hello` -- no convention listing, no verb reference, no onboarding check.
- If nothing is in flight (no recent records, no handoffs), say so directly.
