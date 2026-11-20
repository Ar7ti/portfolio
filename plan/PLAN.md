# PLAN

Step 1 (done): repo + sources → FACTS.md, PROJECTS.md, questions answered.
Step 2 (done): moodboard, jury model, concepts. Chosen: A + A′ tsunami wipe + B receipts, day → dusk → night.
Step 3 (done, one wording pending): COPY.md.
Step 4 (done): 25 issues #2–#26 in 7 milestones (plan/ISSUES.md), prompts in plan/prompts/.
Step 5 (done): built issue by issue. Step 6 (done): deploy (#6). Step 7 (done 2026-11-20, four rounds): review loop (#26); see Do not break below.

## Jury model

Ranked by Kirill's goals right now: internships / summer jobs / junior roles first, Aalto in 2027 second.

| # | Audience | How long they look | What they check | How we prove it | Source |
|---|---|---|---|---|---|
| 1 | **Recruiter / internship coordinator** (incl. LHKK placement) | 6–30 s, first screen only | Who is this, what does he build, is there proof, how do I contact him, is he available | First screen: name + "builds games, web products and AI tools" + proof strip (Oxylabs win · published solo Roblox game · 2.6M views on Roblox Shorts) + "Open to…" line + email button. All readable with JS off | H3, ST1, YT2, P11 |
| 2 | **Tech lead / game studio dev** | 2–5 min, one case study + GitHub | Did HE build it, code quality, does he ship, does he understand players | Case studies separate "my part" from the team's, linked to commits; Sky Island showcase repo; 223 solo commits; Shorts audience numbers; 36 tests in Ocean Radar; the portfolio repo itself is clean and public | SC5, ST10, ST12, OR4, YT1–5 |
| 3 | **Game studios specifically** (Roblox / mobile) | 1–3 min | Knows Roblox tooling, ships updates, knows the audience | Rojo + React-lua + Luau strict, Ember Update 1.1, a Short of his own game on a 9.95K-subscriber channel | ST7, ST11, ST13, YT1 |
| 4 | **Aalto admissions / school** (2027) | 3–10 min, reads more | Drive, growth, initiative, trajectory | Dated timeline 2023 → now (channel → first Rojo repo → published game → 3 hackathons → Oxylabs win), "Now building" with last-updated date, honest notes on what didn't work | P8, ST10, H10 |
| 5 | **Hackathon partners / teammates** | 1–2 min | Is he good to team with, what does he do in a team | Exact team credits with links, "my part" per project, speed facts ("two solo projects at one hackathon") | SC9, H8 |

## Do not break
From the review loop (#26, 2026-11-20: four rounds of fresh recruiter, tech-lead, fact-check and visual-QA reviewers).
- **First frame is content**: no loader or gate, the H1 is the LCP, CLS ≈ 0, readable with JS off.
- **Facts system**: every number has a FACTS.md id and the build fails without one (tests/facts.spec.ts); "as of" stamps; receipts marked verified / source / live / code; footer "Numbers checked" date.
- **Honest wording**: "won the Oxylabs challenge" (never 1st place / won Junction), team results labelled as the team's, "My part" vs team with teammates named and linked, "Built with AI" in the README, footer and Shill or Chill case.
- **Code receipts**: excerpts of his own lines linked at a pinned commit (score.py 998–1012, WaveService.luau 96–117).
- **Sea tiers**: tier 2 three.js on capable desktops (an NVIDIA desktop gets it: tested in real Chrome), tier 1 2D shader on phones, tier 0 still under reduced motion; Pause control; the island never covers text (tests/hero-island.spec.ts, 1280–1920 × 3 tiers).
- **Day → dusk → night → sunrise** scroll system with no hard seams, and the tsunami page wipe into case studies.
- **Contact**: email + Copy on the first screen (also 390×844), sticky Contact that never covers text, one-page CV + PDF from cv.yaml (regenerate with npm run cv after any CV change).
- **CI**: checks, Playwright (360/390/768/1440, JS off, reduced motion, axe), lychee links, Lighthouse budgets; PR previews; prod deploy on main.
- **404** returns a real 404 ("This island sank.").
