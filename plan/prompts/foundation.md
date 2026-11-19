# Prompt: Foundation & deploy

Run this in its own T3 chat in the `Ar7ti/portfolio` repo: `Execute plan/prompts/foundation.md`.
Talk to Kirill in Russian. Code, commits, issues, PRs and comments in English. Site copy in English, exactly from `plan/COPY.md`.

## Read first (every session)
1. `plan/PLAN.md` (jury model, do-not-break list), `plan/FACTS.md`, `plan/PROJECTS.md`, `plan/COPY.md` (rules at the top), tail of `plan/DECISIONS.log`.
2. `plan/ISSUES.md` (global acceptance criteria) and the open issues: `gh issue list --milestone "M1 Foundation & deploy"`.
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
1. Scaffold the Astro site and tooling
2. Design tokens and type system
3. Content layer: facts, projects and copy as typed data
4. CI: build, checks and budgets
5. Deploy: Cloudflare previews per PR, prod from main

## Area notes
- Stack decided in DECISIONS.log (2026-11-20): Astro + TS strict, three.js only as a late island, Lenis, Playwright, Lighthouse CI, lychee, Cloudflare Workers static assets.
- For deploy you need `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Don't ask for the values in chat: write Kirill exact click-by-click steps to create the token (Workers edit permission) and add both as GitHub Secrets, then wait.
- Port the mobile type check from `concepts/f-full-copy.html` work into Playwright (no element wider than its box, no h-scroll, big figures don't wrap) and run it in CI.
