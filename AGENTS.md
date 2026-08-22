---
description: Synesis — shared team knowledge protocol
---

# Agent Instructions

Read and follow `PROTOCOL.md` in this repository. It defines the directory structure, frontmatter conventions, verbs, and skills that govern this team's shared knowledge.

## Quick reference

- **Verbs:** See `VERBS.md` for available commands (hello, onboard, decide, lint, search, etc.)
- **Skills:** See `skills/` for agent capabilities and their triggers
- **People:** See `people/` for team member profiles
- **Records:** See `records/` for decisions and institutional memory
- **Conventions:** See `conventions/` for team standards and practices

## Identity detection

On first interaction, read `git config user.name` and `git config user.email` to identify the current user. Match against profiles in `people/`. If no match exists, run the onboard skill.

## Multi-root workspace

If this repo is open alongside project repos in a VS Code multi-root workspace, use this repo for team context (conventions, ownership, past decisions) while working in the project repos. Project repo instructions take precedence over this repo's instructions on any conflict.
