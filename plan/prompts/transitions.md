# Prompt: Transitions & motion

Run this in its own T3 chat in the `Ar7ti/portfolio` repo: `Execute plan/prompts/transitions.md`.
Talk to Kirill in Russian. Code, commits, issues, PRs and comments in English. Site copy in English, exactly from `plan/COPY.md`.

## Read first (every session)
1. `plan/PLAN.md` (jury model, do-not-break list), `plan/FACTS.md`, `plan/PROJECTS.md`, `plan/COPY.md` (rules at the top), tail of `plan/DECISIONS.log`.
2. `plan/ISSUES.md` (global acceptance criteria) and the open issues: `gh issue list --milestone "M5 Transitions"`.
3. Open PRs (`gh pr list`): never duplicate work in progress.
4. Reference prototypes on main in `concepts/` (open them via a local static server). The approved look is `concepts/f-full-copy.html`; the approved motion is `concepts/d-day-to-night.html`.

## Hard rules
- Every number on the site has a FACTS.md id. No new claims, no adjectives instead of proof. "Won the Oxylabs challenge", never "1st place" or "won Junction".
- Mono font only for small labels. Headings never break mid-word. Check 360 and 390 px.
- Animation never blocks content. LCP = hero text. Lighthouse mobile ≥ 90 / a11y ≥ 95 / SEO ≥ 95. Reduced motion respected. JS off still readable.
- Secrets only in GitHub Secrets / `.env`. Never send messages, buy things or publish anything outside the repo and its deploys.
- Never force-push main.

## Workflow per issue
1. Pick the next open issue of this milestone (order below). Comment on it with your plan and any decision + why; log decisions in `plan/DECISIONS.log` (`date time, decision, why`).
2. Branch `feat/<short-name>`. Small commits.
3. Before/after screenshots (desktop 1440 + mobile 390), Lighthouse mobile result.
4. PR: what changed and why, screenshots, Lighthouse, "Closes #N". Merge yourself only when CI is green and nothing on the do-not-break list broke.
5. **STOP after each issue**: send Kirill a short summary in Russian (what changed, link, screenshots, numbers) and wait for "дальше".

## Issues in this area (in order)
1. Tsunami wipe into and out of case studies
2. Motion layer: smooth scroll, springs, magnetic buttons, mask reveals

## Area notes
- Reference: `concepts/a2-shrunk-stud-tide-lite.html` (button "Open a case study"): only the wipe is approved from A′, not its hero.
- Springs everywhere, no linear/default easing. Everything off under reduced motion.
