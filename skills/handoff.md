---
name: handoff
description: Transfer ownership or context on a piece of work
triggers:
  - handoff verb
---

# Handoff

When triggered, create a handoff record capturing the transfer of work between team members.

## Steps

1. **Prompt for the handoff.** Ask:
   - What's being handed off? (feature, bug, area of ownership)
   - Current state (what's done, what's in progress, what's blocked)
   - Open questions or gotchas the next person should know
   - Who's handing off? (initials)
   - Who's picking it up? (initials)

2. **Create the record.** Write `records/{date}-handoff-{slug}.md` using the record template. Tag with `handoff` plus any relevant topic tags.

3. **Link related content.** Add `[[wikilinks]]` to the people involved, relevant conventions, and any prior records or decisions related to the work.

4. **Commit and push.** Commit with a message like: `records: handoff {slug} from {from} to {to}`. Push to the remote.

## Notes

- The handoff record is a snapshot. It should contain enough context that the receiving person (or their agent) can pick up the work without a synchronous conversation.
- If there are related files in `attachments/`, reference them.
