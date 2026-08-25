---
name: note
description: Record something the team learned, with no decision attached
triggers:
  - note verb
  - log this
  - write this up
  - record a finding
---

# Note

When triggered, file a **note** — a dated record of something learned, observed, or worked out. No decision, no options, nobody choosing anything.

`decide` records what the team **chose**. `note` records what the team **found**.

## What belongs here

- A postmortem, or what actually caused an incident
- A benchmark, a measurement, a profiling result
- Research: how a third-party system behaves, what an API actually returns
- A debugging session's conclusion — the thing that would otherwise be rediscovered next year
- Anything a teammate would want to read before repeating the work

## What does not

- **A decision** — use `decide`. If someone chose between options, it needs attribution and a supersession chain.
- **An open question** — use `propose`.
- **How the team works** — use `convention`. Standing practice is a living document; a note is a snapshot of one moment.
- **A running list that gets edited forever** — an index, a backlog, a catalogue. Notes are immutable once filed, so anything meant to be appended to and revised belongs in `conventions/`, which is living by design.

## Steps

1. **Collect the finding.** Extract what you can from the user's message; ask only for what is missing:
   - What was learned?
   - How was it established? (measured, reproduced, read in a source, hit in production)
   - What should someone do differently knowing it?

2. **Write the record.** `records/{date}-{slug}.md` — get the date by running `date +%F`, never by inferring it (see Dates in `PROTOCOL.md`):

   ```yaml
   ---
   title: What was learned
   type: note
   date: YYYY-MM-DD
   decided-by: []        # empty — nothing was decided
   consulted: []
   last-verified: YYYY-MM-DD
   superseded-by:        # set only when a later note corrects this one
   tags: [...]
   ---
   ```

   **A note carries no `status` field.** Nothing was proposed and nothing was accepted, so there is no answer to record. Whether the finding still stands is answered by `superseded-by` alone.

   `type: note` is what distinguishes it. Without that field a record is a decision, and `lint` will flag it for having no `decided-by` and no `status`.

   Structure the body around the finding rather than the decision template: what was observed, how it was established, what follows from it. Do not force it into Context / Options / Decision / Consequences — there were no options.

3. **Cite the evidence.** A note without provenance is a rumour. Link the commit, the incident, the benchmark output, the source file. If it was measured, say what the numbers were and on what.

4. **Link related content.** `[[wikilinks]]` in body prose where a sentence explains a connection. Do **not** hand-write a `## Related` block — run `weave` after filing.

5. **Commit and push.** `records: note {slug}`.

## Notes

- Notes are **immutable once filed**, exactly like accepted decisions. A finding that turns out to be wrong is corrected by filing a new note and setting `superseded-by` on the old one — the wrong finding stays, because someone will otherwise redo the work and reach the same wrong answer.
- Notes carry no `decided-by` and no `status`, and `lint` asks for neither. A note with a `status` field is a lint error, not a harmless extra.
- `hello` and `status` lead with decisions and open questions. Notes surface through `search` and through the links `weave` builds — they are reference material, not headlines.
