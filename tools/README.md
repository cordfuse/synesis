# Tools

Team-shared scripts that don't belong in any single project repo. Add scripts here (PowerShell, bash, Node, etc.) and document them below.

## Index

<!-- Add one row per tool as you add scripts -->

| Script | Language | What it does |
|---|---|---|
| `lint.ts` | TypeScript | Vault hygiene checks — stale knowledge, broken links, missing attribution, orphaned profiles, unfilled templates, weave block integrity. Run `bun tools/lint.ts` (or `npx tsx tools/lint.ts`). Exits 1 on findings. No dependencies. |
