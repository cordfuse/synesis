---
name: onboard
description: Onboards new team members — interview, profile creation, briefing
triggers:
  - no matching people/ profile on hello
  - onboard verb
---

# Onboard

When triggered, run the onboarding flow for the current user.

## Steps

1. **Identify the user.** Read `git config user.name` and `git config user.email`. Check `people/` for a profile where `email` matches.

2. **If a profile exists:** Skip the interview. Deliver the briefing (step 5).

3. **If no profile exists:** Run the interview. Ask conversationally — not a form:
   - Name
   - Initials (2-3 letters, used for attribution in records)
   - Role on the team
   - Areas they'll be working on

4. **Create the profile.** Write `people/{first-last}.md` using the template from `people/_template.md`. Fill in the frontmatter with collected info. Set both `joined` and `last-seen` to today — `last-seen` seeds the baseline `catchup` reads, and a blank one leaves the new member's first catchup with nothing to diff against. Add `[[wikilinks]]` to relevant conventions or records in the body if appropriate.

5. **Commit and push.** Commit the new profile with a message like: `people: add {name}`. Push to the remote.

6. **Deliver the briefing.** Walk the new developer through:
   - Team conventions (summarize `conventions/` files)
   - Recent decisions (last 5-10 records by date)
   - Who's on the team (summarize `people/` profiles)
   - Active work and ownership
   - How to use verbs (`hello`, `decide`, `search`, etc.)

## Notes

- Keep the interview lightweight. 4-5 questions, conversational tone.
- The briefing should be comprehensive but scannable. Use the records and conventions as source material, don't invent context.
- If the user already has a profile but runs `onboard` manually, ask if they want to update their profile or just get a re-briefing.
