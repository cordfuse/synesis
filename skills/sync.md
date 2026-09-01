---
name: sync
description: Pull latest vault changes and push any local uncommitted work
triggers:
  - sync verb
---

# Sync

When triggered, bring the vault up to date with the remote and push any local work.

## Steps

1. Check for uncommitted changes in the vault. If any exist, commit them with a descriptive message.
2. Run one bounded pull — `pull --rebase` fetches on its own, so a separate `git fetch` first opens a second connection for nothing:

   ```sh
   git -c core.sshCommand="ssh -o ConnectTimeout=5 -o BatchMode=yes" \
       -c credential.interactive=false \
       -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=5 \
       pull --rebase origin main
   ```

   Bounded for the same reason hello's fetch is: an unreachable host hangs, and a credential prompt hangs worse.
3. If the rebase encounters conflicts, report them and stop — do not auto-resolve.
4. If there are local commits ahead of origin, push them.
5. Briefly summarize what changed: new or updated files pulled, and anything pushed.

## When to use

- Mid-session when working with a team — someone else may have pushed conventions or decisions.
- Before a `hello` briefing to ensure the briefing reflects current state.
- After filing a decision or convention to share it immediately.

## Not the same as `reconcile`

`sync` talks to **your own remote** (`origin`) — your vault, your team's copy. It will report everything up to date even when your protocol files have drifted badly from the template the vault was created from.

Comparing against the upstream template is `reconcile`'s job, and it is a different remote, a different question, and a file-level diff rather than a history operation. If someone asks why their vault is missing a verb or a protocol section that the template has, `sync` is not the answer — point them at `reconcile`.
