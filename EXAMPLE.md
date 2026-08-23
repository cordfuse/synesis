# Synesis in action

A vault's first week, start to finish. Two developers, one agent, no setup docs.

Everything below is real protocol behaviour — the verbs, the files, and what the agent says back. Delete this file once your team has its own history; it ships with the template so your first week has something to imitate.

---

## Day 1 — Sarah creates the vault

Sarah clicks **Use this template** on `cordfuse/synesis`, clones her team's new vault, opens it in her agent and types:

```
hello
```

The agent reads `PROTOCOL.md`, then checks `people/` for a profile matching `git config user.email`. There isn't one — the vault is empty — so it runs `onboard` instead of briefing her:

> No profile found for `sarah.chen@company.com`. Let's set you up.
>
> What's your name, and what initials should attribute your decisions?

Four questions later (name, initials, role, areas of work) it writes `people/sarah-chen.md`, commits it, and delivers a briefing that is honest about having nothing to say yet:

> **Team** — 1 person. You.
> **Recent decisions** — none yet.
> **Active conventions** — none yet.
> **Verbs** — hello, decide, search, status, catchup, lint, weave, archive, update, handoff, reconcile, sync, onboard.
>
> The vault is empty. File your first decision with `decide`, or write down how your team works with a convention.

```markdown
---
name: Sarah Chen
initials: SC
aliases: [SC, Sarah]
email: sarah.chen@company.com
role: Frontend developer
joined: 2026-08-18
last-seen: 2026-08-18
tags: [frontend, auth]
---

## Expertise

- React, Next.js, TypeScript
- Auth flows and session management
- Accessibility (WCAG 2.1 AA)

## Owns

- Auth UI (login, signup, password reset)
- Dashboard components
- Design system tokens
```

`joined` and `last-seen` are both stamped today. `last-seen` matters later — it's the baseline `catchup` reads.

---

## Day 2 — the first convention

Before deciding anything, Sarah writes down how the team already works. Conventions are plain files; no verb required.

```markdown
---
name: Git branching strategy
last-verified: 2026-08-18
tags: [git, workflow]
---

All work happens on feature branches off `main`. Branch naming:
`feat/short-description`, `fix/short-description`, `chore/short-description`.

PRs require one approval before merge. Squash merge to keep `main` linear.
Delete the branch after merge — no long-lived branches except `main`.

Hotfixes branch directly from `main` and merge back with a regular PR.
No cherry-picking between branches.
```

From now on, every agent session — hers, her teammate's, whichever harness they use — reads this before touching a branch.

---

## Day 3 — a real decision

The team picks an auth provider. Sarah doesn't want to write the record by hand:

```
decide: we're going with Clerk for auth, evaluated against Auth0 and Supabase Auth
```

The agent extracts what it can from that sentence and asks only for what's missing — who decided, who was consulted, what the trade-offs were. Then it writes `records/2026-08-18-auth-provider.md`:

```markdown
---
title: Auth provider decision
date: 2026-08-18
decided-by: [SC, MK]
consulted: [JL]
last-verified: 2026-08-18
status: active
superseded-by:
tags: [auth, architecture]
---

## Context

We needed a managed auth provider for the SaaS launch. Rolling our own
was ruled out — too much surface area for a two-person team.

## Options considered

- **Auth0** — mature, expensive at scale, complex dashboard
- **Clerk** — modern DX, good Next.js integration, newer company
- **Supabase Auth** — free tier, already using Supabase for DB

## Decision

Clerk. Best DX for our stack (Next.js + React), and the pricing model
scales linearly. [[people/sarah-chen]] evaluated all three over a week.

## Consequences

- Auth UI components come from Clerk's React SDK
- Session tokens are JWTs — middleware validates on every request
- Follow-up: migrate the existing email/password prototype by EOW
```

Two things to notice.

The `[[people/sarah-chen]]` link in the Decision section is an **authored** link — a sentence explaining a connection. Write those wherever they help.

There is no `## Related` block. That block is **derived**, and only `weave` writes it. The record is filed first; the graph comes next.

---

## Day 3, later — weave

```
weave
```

> Scanned 2 files. Wrote 1 block, 2 links.
>
> `records/2026-08-18-auth-provider` ↔ `conventions/git-branching` — the branching rules this work follows

Weave appends a block at the end of each file:

```markdown
## Related

<!-- weave:start -->
- [[conventions/git-branching]] — the branching rules this work follows
<!-- weave:end -->
```

Links are conservative — a real relationship, not two files that happen to mention git. They're reciprocal: if A lists B, B lists A. And they're regenerable: delete every block, run `weave` again, get the same links back.

Run it twice in a row and the second run changes nothing.

---

## Day 5 — Mike joins

Mike clones the vault and types `hello`. No profile matches his email, so he gets the same interview Sarah did — and then a briefing that now has content:

> **Team** — 2 people. Sarah Chen (Frontend, owns auth UI), you.
> **Recent decisions** — Auth provider decision (2026-08-18, SC/MK, active).
> **Active conventions** — Git branching strategy.

He didn't read an onboarding doc. Nobody wrote one. The vault was the onboarding doc.

---

## Day 12 — Sarah comes back

Sarah's been on other work for a week:

```
catchup
```

The agent reads `last-seen` from her profile, diffs git history since that date, and groups what changed:

> **Since 2026-08-18 — 9 commits**
>
> - **New records (1):** Rate limiting approach (2026-08-24, MK)
> - **New conventions (2):** Commit message format, Deployment process
> - **People:** Mike Kowalski joined 2026-08-20
> - **Superseded (1):** Auth provider decision → replaced by Auth provider revisit

Then it stamps `last-seen` to today. That field belongs to `catchup` alone — `hello` deliberately never touches it, because a greeting that stamped today's date would erase the very baseline this depends on.

---

## Day 30 — the decision changes

Clerk didn't work out. Records are **append-only**, so nobody edits the old one:

```
decide: moving off Clerk to Supabase Auth, the pricing changed
```

The agent files a new record and sets two fields on the old one:

```yaml
status: superseded
superseded-by: records/2026-09-17-auth-provider-revisit
```

The original stays exactly as written. Both records live in the vault, and the chain shows what the team believed in August and what changed in September. `search` finds both and points from the old one to its replacement.

Editing the body would have destroyed that. It's the one thing the protocol won't let you do.

---

## Day 90 — hygiene

```
lint
```

> **Stale knowledge:**
>   `conventions/deployment.md` — last verified 2026-08-19 (91 days ago)
>
> **Missing attribution:**
>   `records/2026-09-02-cache-strategy.md` — no decided-by
>
> No broken links. No orphaned profiles. No unfilled templates. No weave problems.

Nothing is deleted or auto-fixed — lint reports, the team decides. Sarah re-reads the deployment convention, confirms it's still right, and runs `update conventions/deployment` to bump the date.

The stale one that *isn't* still right gets retired:

```
archive conventions/old-deploy-process
```

That sets `archived: true`, then re-runs `weave` so nothing still links to it. It disappears from briefings, status and lint — but `search` still finds it, labelled `[archived]`. Retired, not deleted.

---

## Later — the template moves on

Synesis ships a new protocol version. Your vault was made with **Use this template**, so there's no fork relationship and nothing to merge:

```
reconcile
```

> Reconcile diff (vault vs template):
>
> **Behind — 1 file:** `skills/rollup.md` — new verb upstream
> **Drifted — 1 file:** `skills/lint.md` — content differs
> **Ahead — 0 files**
>
> Resolve each? (y/skip/abort)

Every file is gated one at a time. Your records, conventions and people are never in scope — reconcile only ever looks at the protocol files you inherited.

---

## That's the whole loop

| Verb | What it does |
|---|---|
| `hello` | briefing, or onboarding if you're new |
| `decide` | file a decision with attribution |
| `weave` | link related files into a navigable graph |
| `catchup` | what changed since you were last here |
| `search` | find anything, including archived |
| `lint` | hygiene report — never auto-fixes |
| `update` | re-verify, or supersede |
| `archive` | retire without deleting |
| `handoff` | transfer work with context |
| `status` | what's in flight, who owns what |
| `sync` | pull and push your own remote |
| `reconcile` | drift check against the template |
| `onboard` | interview and profile a new member |

No server. No database. No API keys. Markdown files in a git repo, and any agent that can read a file.
