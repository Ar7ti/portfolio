# ISSUES

Source of truth for the GitHub issues (created from this file on 2026-11-20). Format: `## [milestone] title`, then the body.
Every issue: one branch `feat/<short-name>`, one PR with what/why, before/after screenshots (desktop + mobile), Lighthouse result. Stop and report to Kirill after each.

Global acceptance criteria (apply to every issue, not repeated below):
- No console errors. No horizontal scroll at 360 px. Headings never break mid-word.
- Every number on the page traces to a FACTS.md id in the content data.
- `prefers-reduced-motion` respected; content readable with JS off.
- Nothing on the "do not break" list in PLAN.md breaks.

---

## [M1 Foundation & deploy] Scaffold the Astro site and tooling
Set up the project the rest of the work builds on.

**Acceptance criteria**
- Astro + TypeScript strict, `npm run dev/build/preview/check/test` scripts.
- ESLint + Prettier, `.editorconfig`, LF line endings.
- Fonts self-hosted and subset (Anybody, Schibsted Grotesk, Martian Mono), only the hero face preloaded.
- Base layout with skip link "Skip to the point", `lang="en"`, landmarks.
- README explains how to run, test and add a project.

## [M1 Foundation & deploy] Design tokens and type system
Turn the approved mock (`concepts/f-full-copy.html`) and COPY.md rules into tokens and components.

**Acceptance criteria**
- CSS custom properties for day, dusk and night palettes (`#090709`, `#8823b5`, `#e0685b`, `#cf2672`, day sea colours, `#C8F560` receipts).
- Type roles as components/classes: LABEL (mono), H1/H2 (Anybody), BIG, LEAD, BODY (Schibsted Grotesk), HL.
- Mono only for labels. Body text sans, 17–18 px, max ~60 characters per line.
- Mobile rules from COPY.md: big figures stack in a column, `overflow-wrap: normal` on headings, `clamp()` sizes fit the longest word at 360 px.
- Playwright type check (port of the mock's check) passes at 360 and 390 px.

## [M1 Foundation & deploy] Content layer: facts, projects and copy as typed data
Copy lives in data, not hard-coded in components.

**Acceptance criteria**
- Content collections for projects, cases, timeline, archive, contacts, with every figure carrying its FACTS.md id.
- A test fails the build if a number in content has no FACTS id.
- "As of" dates rendered from data (YouTube numbers, commit counts).

## [M1 Foundation & deploy] CI: build, checks and budgets
**Acceptance criteria**
- GitHub Actions on every PR: install, typecheck, build, Playwright (360/390/768/1440, reduced motion, JS off), lychee link check, Lighthouse CI.
- Lighthouse budgets: mobile performance ≥ 90, accessibility ≥ 95, SEO ≥ 95, LCP < 2.5 s, CLS < 0.1. CI fails below them.
- PR template with what/why, screenshots and Lighthouse sections.

## [M1 Foundation & deploy] Deploy: Cloudflare previews per PR, prod from main
**Acceptance criteria**
- Cloudflare Workers static assets; `wrangler.jsonc` in the repo.
- Every PR gets a preview URL posted as a PR comment; merges to main deploy prod.
- Secrets only in GitHub Secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`), added by Kirill; the issue lists exactly what he has to click.
- Custom 404 served for unknown paths.

---

## [M2 Liquid hero] Static hero, LCP = text
**Acceptance criteria**
- Hero from COPY.md (25 words) in plain HTML/CSS, readable with JS off.
- A beautiful static day-sea image (AVIF/WebP, responsive) behind it as the no-WebGL and reduced-motion fallback.
- LCP element is the H1; no layout shift when the canvas arrives (CLS < 0.1).
- Email button + copy-to-clipboard, LinkedIn, GitHub, CV links.

## [M2 Liquid hero] Capability tiers
Decide once per visit which sea the device gets.

**Acceptance criteria**
- Tier 0: static image (reduced motion, no WebGL, Save-Data, JS off).
- Tier 1: 2D shader sea (mobile, `deviceMemory` ≤ 4, `hardwareConcurrency` ≤ 4, or the 3D tier's first 30 frames average > 22 ms).
- Tier 2: full three.js 3D sea (capable desktops).
- Tier chosen after first paint; a "Calm the water" toggle forces tier 0 and is remembered.
- Debug query `?tier=0|1|2` for testing.

## [M2 Liquid hero] Tier 2: three.js "Stud Tide" sea with Sky Island
Port prototype `concepts/a-moonshot-stud-tide.html` / `d-day-to-night.html` into a production island component.

**Acceptance criteria**
- Dynamic import of three.js after the hero paints (idle callback); not in the initial bundle.
- Thick-liquid sim (damped wave + viscosity), cursor/finger stirring, scroll-sent waves, opening wave, Sky Island.
- 60 fps on a mid-range laptop at 1440×900 (measured, numbers in the PR).
- Pauses when off-screen or tab hidden; cleans up on navigation.

## [M2 Liquid hero] Tier 1: lightweight 2D sea for phones
**Acceptance criteria**
- One fragment shader, no three.js. Reads as the same studded sea seen at an angle, **not** as columns/bars (the A′ side view is rejected).
- Touch stirring, scroll waves, same day/dusk/night palette hooks as tier 2.
- Lighthouse mobile performance ≥ 90 with this tier active.

## [M2 Liquid hero] Day → dusk → night scroll system with neon reflections
**Acceptance criteria**
- One scroll-driven progress value (spring-smoothed) drives sky, sea palette, fog, lights and page background, in both WebGL tiers and in the static fallback (CSS).
- Sunset stop between day and night (violet → coral), no muddy grey.
- Neon light sticks (`#8823b5`, `#e0685b`, `#cf2672`) appear at night and reflect in the water, bent by waves.
- Night → sunrise before Case 02 (Sky Island in daylight).
- Text columns always have a scrim; contrast AA everywhere.

---

## [M3 Sections] Hackathons strip
**Acceptance criteria**
- "3 hackathons. 4 projects." with the three events, Junction 2026 row highlighted.
- Photo 04 background, dark scrim on the text side, credit "Photo: Junction".

## [M3 Sections] Cards: YouTube, Guardio, Now building
**Acceptance criteria**
- YouTube card: "2.6M views" on one line, 9.95K / 33 Shorts, three Short covers with view counts, "as of" date.
- Guardio card with screenshot, team credit wording from COPY.md.
- Throw Treats card doubles as "Now building" with its last-updated date.

## [M3 Sections] Timeline and archive
**Acceptance criteria**
- Dated timeline from COPY.md, Junction 2026 row emphasised, Aalto 2027 styled as "next".
- Archive collapsed by default (`<details>`), "paused" / "planned" tags, works without JS.

---

## [M4 Case studies] Case study template + Case 01 Shill or Chill
**Acceptance criteria**
- Reusable case layout: label, H2, one-liner, three BIG results, media, LEAD blocks, receipts, CTA.
- Case 01 copy exactly as approved; photos 01 and 02; teammates linked.
- ≤ 150 words; skim test passes (big text + highlights tell the story).
- Each case has its own URL (`/work/shill-or-chill`) and is also shown on the home page.

## [M4 Case studies] Case 03 Junction X Turku: two solo projects
**Acceptance criteria**
- Two sub-blocks (Ocean Opportunity Radar, Life Simulator) with media, links, video.
- No "Next time" block (Kirill's decision).

## [M4 Case studies] Case 02 Sky Island Tower Defense + real gameplay media
**Acceptance criteria**
- Case copy from COPY.md (hardest call: pending Kirill's OK on the UI wording).
- Record real gameplay in Roblox Studio (place towers, boss wave, ALL CLEAR) → 6–10 s muted MP4/WebM loop + poster.
- Links: play on Roblox, showcase code, Short.

## [M4 Case studies] Receipts system
**Acceptance criteria**
- Claims marked in content link to their receipts (source, date, verified/source tag).
- Receipts collapsed per case, keyboard accessible.
- Desktop enhancement: ink-drip from claim to receipt (prototype B); off on touch and reduced motion.

---

## [M5 Transitions] Tsunami wipe into and out of case studies
**Acceptance criteria**
- Opening a case: a voxel tsunami covers the screen and drains like honey to reveal the case (A′ wipe), ≤ 1.2 s.
- Uses the View Transitions API where available, plain navigation otherwise.
- Back button returns with the reverse wipe and restores scroll position.
- Reduced motion: instant swap.

## [M5 Transitions] Motion layer: smooth scroll, springs, magnetic buttons, mask reveals
**Acceptance criteria**
- Lenis smooth scroll that never blocks native scroll, keyboard or anchor jumps.
- Spring utilities (no linear/default easing); magnetic primary buttons; headline mask reveals; media that bends with scroll velocity.
- All of it off under reduced motion; no motion delays content.

---

## [M6 Contacts & CV] Contact section, footer and 404
**Acceptance criteria**
- Contact copy from COPY.md; email copy button with a visible confirmation; Telegram as secondary.
- Contact reachable in one click from every case (CTA + sticky contact link).
- Footer with repo link and "numbers checked" date. 404 "This island sank." in the site's style.

## [M6 Contacts & CV] CV PDF that matches the site
**Acceptance criteria**
- Kirill answers the CV question list first (separate message).
- One-page English CV generated from the same content data, same type system, selectable text, ≤ 300 KB.
- Linked from hero, contact and every case.

---

## [M7 Polish & performance] SEO, OG image, favicon
**Acceptance criteria**
- Title/description from COPY.md, canonical, sitemap, robots.
- OG image 1200×630 (day sea + name + line), checked in LinkedIn/Discord preview tools.
- Favicon set (SVG + PNG), theme colour.

## [M7 Polish & performance] Accessibility and reduced-motion pass
**Acceptance criteria**
- Keyboard path through everything with visible focus; alt text on every image; contrast AA.
- axe: zero serious/critical issues. Lighthouse accessibility ≥ 95.

## [M7 Polish & performance] Performance pass
**Acceptance criteria**
- Lighthouse mobile performance ≥ 90 on the deployed preview (3 runs, median), LCP < 2.5 s, CLS < 0.1.
- 60 fps on the heavy scenes (tier 2 desktop, tier 1 phone), numbers in the PR.
- Images AVIF/WebP with sizes; video lazy; three.js and Lenis not in the initial bundle.

## [M7 Polish & performance] Review loop and launch
**Acceptance criteria**
- Brief section 11: recruiter, tech lead, fact-checker, visual QA subagents that did not see the work.
- Iterate until a fresh reviewer says "Would interview: yes" with all scores ≥ 8.
- "Do not break" list recorded in PLAN.md; every live link checked; final Lighthouse numbers reported to Kirill.
