# Prompt: Liquid hero

Run this in its own T3 chat in the `Ar7ti/portfolio` repo: `Execute plan/prompts/liquid-hero.md`.
Talk to Kirill in Russian. Code, commits, issues, PRs and comments in English. Site copy in English, exactly from `plan/COPY.md`.

## Read first (every session)
1. `plan/PLAN.md` (jury model, do-not-break list), `plan/FACTS.md`, `plan/PROJECTS.md`, `plan/COPY.md` (rules at the top), tail of `plan/DECISIONS.log`.
2. `plan/ISSUES.md` (global acceptance criteria) and the open issues: `gh issue list --milestone "M2 Liquid hero"`.
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
1. Static hero, LCP = text
2. Capability tiers
3. Tier 2: three.js "Stud Tide" sea with Sky Island
4. Tier 1: lightweight 2D sea for phones
5. Day → dusk → night scroll system with neon reflections

## Area notes
- The sea must feel thick and springy: high damping, viscosity, overshoot, slow settle (see MOODBOARD.md: Lusion, Igloo).
- Tier 1 must NOT look like the A′ side-view columns: Kirill said it reads like a bar chart / equalizer.
- Measure fps with a real browser on Kirill's laptop when possible; headless numbers don't count.
- Palette and sunset stop: prototype D (`DAY`, `DUSK`, `NIGHT` objects).
