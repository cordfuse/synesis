---
version: 0.1
---

# Verbs

Verbs are commands a developer can give to an AI agent working in this vault. The agent reads this file to know what's available.

| Verb | What it does |
|---|---|
| `hello` | Briefing: active work, recent decisions, team status. If no `people/` profile matches the current git user, triggers `onboard` automatically. |
| `status` | What's in flight, who's working on what. Summarizes recent records and any active handoffs. |
| `onboard` | Run the onboarding flow: interview the developer, create their `people/` profile, commit and push it, then deliver a full team briefing. Can also be triggered manually for profile updates or re-briefing. |
| `decide` | File a new decision record. The agent prompts for title, context, options considered, decision, and who was consulted. Writes `records/{date}-{slug}.md` with proper frontmatter. |
| `handoff` | Transfer ownership or context on a piece of work. The agent creates a record capturing what's being handed off, current state, open questions, and who's picking it up. |
| `lint` | Check vault hygiene: stale knowledge, broken links, missing attribution, orphaned profiles, empty templates. Reports findings — does not auto-fix. |
| `search` | Find knowledge across records, conventions, and people profiles. The agent searches file contents and frontmatter tags. |
