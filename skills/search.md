---
name: search
description: Find knowledge across records, conventions, and people profiles
triggers:
  - search verb
---

# Search

When triggered, search the vault for relevant knowledge.

## How to search

1. **Parse the query.** Understand what the developer is looking for — a decision, a convention, a person, a topic.

2. **Search strategy:**
   - Check `tags` in frontmatter across all content files
   - Search file titles and frontmatter fields (`title`, `name`, `role`, `decided-by`)
   - Search file body content for keywords
   - Check `[[wikilinks]]` to find related content from matching files

3. **Return results.** For each match, report:
   - File path
   - Title or name from frontmatter
   - A brief summary of the content (1-2 sentences)
   - Tags
   - Status (active/superseded) for records

4. **Follow links.** If a matching record references other records or conventions via wikilinks, mention those as related content.

## Notes

- Prioritize exact tag matches over body text matches.
- If a record is superseded, point the developer to its replacement via `superseded-by`.
- For people searches, match against `name`, `initials`, `aliases`, `role`, and `tags`.
