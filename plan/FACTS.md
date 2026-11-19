# FACTS

Every number and claim on the site must trace to a row here. Read on 2026-11-19 unless noted.

Status: **V** = verified from an independent or primary source; **S** = self-reported (Kirill's own README/site/brief), not yet independently confirmed; **?** = open question for Kirill (see the end of this file).

## Person

| # | Fact | Status | Source |
|---|---|---|---|
| P1 | Name: Kirill Jegosin | V | brief; https://github.com/JustinasLa/gemini-4-braincells (credits) |
| P2 | Age 18, lives in Finland | S | brief; old site About; GitHub profile README |
| P3 | ICT student at FAI | S | brief; LinkedIn headline per playbook ("Software Developer \| ICT Student @ FAI") |
| P4 | Email: k.jegosin@gmail.com | V | brief; old site contact (mailto) |
| P5 | GitHub: https://github.com/Ar7ti | V | gh CLI |
| P6 | LinkedIn: https://www.linkedin.com/in/kirill-jegosin-807199412/ | S | brief; old site. Page is login-walled (HTTP 999), content not readable |
| P7 | Telegram: https://t.me/krnl_159 | V | old site; GitHub profile README. **Keep on new site? ?** |
| P8 | YouTube: https://www.youtube.com/@Sharky_main (brief also calls it "Sharky_blox") | ? | brief. Blocked by consent wall, nothing readable |
| P9 | "Started programming 2024", "Learned React 2025" | S | old site timeline only, no other source |
| P10 | LinkedIn headline, education dates, experience | ? | not readable |

## Hackathons

| # | Fact | Status | Source |
|---|---|---|---|
| H1 | Junction 2026 took place 13–15 Nov 2026 in Espoo | V | https://www.espoo.fi/en/events/espooevents:agp767vqb4 (event listing) |
| H2 | Team "Gemini 4 Brain Cells": Justinas Launikonis, Temuulen "Tibi" Norovpel, Kirill Jegosin, Valtteri Pertilä | V | team repo README credits https://github.com/JustinasLa/gemini-4-braincells |
| H3 | Shill or Chill won the Oxylabs challenge at Junction 2026 | S | team repo description; Kirill's profile README. **No official Junction/Oxylabs page found → need a link ?** |
| H4 | Shill or Chill took 3rd place in the Hostinger (main-track) challenge | S | same as H3 |
| H5 | Built over the Junction weekend; team repo created 2026-11-13, last push 2026-11-15 | V | GitHub API (createdAt / pushedAt) |
| H6 | Team members met on Discord | S | Kirill's profile README |
| H7 | Junction X Vaasa 2026: attended, built Guardio | S | profile README. Event dates not found → ? |
| H8 | Junction X Turku 2026: attended, built Life Simulator for the If Insurance challenge | S | life-simulator-demo README; profile README. Event dates not found → ? |
| H9 | Ocean Opportunity Radar built for the A'Pelago / Redstone challenge | S | Ocean-Opportunity-Radar README. **Which event? ?** |
| H10 | Hackathon count: at least 3 (Vaasa, Turku, Junction 2026); 4 if Ocean Radar was a separate event | ? | derived from H3–H9 |

## Shill or Chill (Junction 2026)

| # | Fact | Status | Source |
|---|---|---|---|
| SC1 | What: traces memes to their source and spots coordinated spread ("meme trace", "link lookup", "meme swarms") | V | team README |
| SC2 | Live at https://noise-radar.srv2159172.hstgr.cloud (HTTP 200, page title "Trackdown · Shill or Chill") | V | fetched 2026-11-19 |
| SC3 | Stack: Google Gemini, NVIDIA Nemotron VL on a Verda box, Oxylabs Web API, Hostinger VPS, OpenAI Codex, Entire | V | team README |
| SC4 | Nemotron vs Gemini on 60 real clusters: Nemotron 1.5 s mean vs Gemini 12.0 s; cascade caught 18 of 28 coordinated-and-taken-down clusters | V (team result, not Kirill's personally) | team README table, dated 2026-11-14 |
| SC5 | Kirill's part: the "signals" coordination detector (v1 → v1.10: null model, organic guards, friend-group and automation guards, semantic duplicates, red-team fixes), the Bluesky Jetstream → Postgres ingest pipeline (failover, malformed-record handling), and external evaluation against real Bluesky takedowns; wrote METHODOLOGY.md | V | 18 commits by Ar7ti in team repo, 2026-11-13 20:22 → 2026-11-14 16:49 (GitHub API) |
| SC6 | Kirill: "3-4x faster detection passes with identical output" | V (commit message) | commit 2026-11-14 01:01 in team repo |
| SC7 | Commit counts: JustinasLa 90, akmet777 53, entire[bot] 29, Ar7ti 18, valtteripertila 13 | V | GitHub contributors API. Commit count ≠ contribution size; don't publish it |
| SC8 | "Built in 48 h with AI agents" | S | brief. Repo spans ~38 h of pushes; Junction is a weekend event. Use "one weekend" unless Kirill confirms 48 h |

## Sky Island Tower Defense (Roblox)

| # | Fact | Status | Source |
|---|---|---|---|
| ST1 | Published on Roblox: https://www.roblox.com/games/86140743290043/Sky-Island-Tower-Defense | V | page HTTP 200 |
| ST2 | Experience created 2026-10-25, last updated 2026-11-18 | V | games.roblox.com API, universeId 10772907075 |
| ST3 | Creator account: **lollipop_hak** (user 824298538) | V | Roblox API. **Is this Kirill's account? ?** |
| ST4 | Stats on 2026-11-19: 66 visits, 2 favorites, 2 likes / 0 dislikes, 0 playing | V | Roblox API. Small numbers: don't lead with them |
| ST5 | Co-op up to 4 players (party pads → teleport into a match); API maxPlayers = 25 (server size, not party size) | V | game description; showcase README; API |
| ST6 | 15 waves, elites, splitting enemies, boss "the Colossus" | V | showcase README; game description |
| ST7 | Update 1.1 "Ember Update": new map Ember Observatory, Ember Season from Nov 26 with 30 tiers of free rewards | V | game description (API) |
| ST8 | Crate summons, mid-match upgrade/sell, coins/gems/XP, level road; PC + phone | V | game description; showcase README |
| ST9 | Solo project: design, all Luau code, React-lua UI, server-authoritative placement, rewards, saving data, Python playtest scripts for Studio | S | profile README; showcase README ("I made the whole game by myself") |
| ST10 | Private game repo Ar7ti/Tower-Defence-Game: 223 commits, all by Ar7ti, 2026-05-23 → 2026-11-18 | V | GitHub API |
| ST11 | Built with Rojo, Luau, React-lua; made to learn programming | V / S | showcase README (stack); brief (motivation) |
| ST12 | Code showcase: https://github.com/Ar7ti/sky-island-td-showcase (WaveService, EnemyMovement, React-lua UI, tools); anti-cheat/economy parts deliberately left out | V | showcase README |

## Ocean Opportunity Radar

| # | Fact | Status | Source |
|---|---|---|---|
| OR1 | Analyst workspace for ocean funds/accelerators: AI extracts claims with exact quotes, researches online with sources, but never changes a score until a person confirms the evidence | V | README; live app |
| OR2 | Live: https://ocean-opportunity-radar.kirills-portfolio.workers.dev/ (HTTP 200, demo data, fictional startup "Baltic Nutriloop") | V | fetched 2026-11-19 |
| OR3 | Stack: React, TypeScript, TanStack Start, Tailwind, OpenAI API (structured outputs + web search), Vitest, Cloudflare Workers | V | README |
| OR4 | 36 tests | V | counted `it/test(` in src/test/*.ts(x): 1 + 10 + 22 + 3 = 36 |
| OR5 | Solo | S (repo has one author) | profile README; repo commits |
| OR6 | First commit 2026-10-16, deploy/redesign 2026-10-20 | V | GitHub API |
| OR7 | Honest limits: 3 demo startups are made up, catalog has 3 real opportunities | V | README "Honest notes" |

## Life Simulator

| # | Fact | Status | Source |
|---|---|---|---|
| LS1 | AI helper for big life moments (moving, first car, furnishing, trip): plan with budget, tasks, things to buy | V | life-simulator-demo README |
| LS2 | Built for the If Insurance challenge at Junction X Turku | S | README |
| LS3 | Demo: https://ar7ti.github.io/life-simulator-demo/ (static, example data, not real AI results) | V | README; HTTP 200 |
| LS4 | Full version: React, TypeScript, Vite, Tailwind, Fastify, OpenAI API; repo Ar7ti/if-lifeSaver (32 commits, all Ar7ti, 2026-10-17 → 2026-10-26, Playwright tests) | V | GitHub API |
| LS5 | Old site called it "Public beta" and listed Next.js | ✗ conflicts with repo (Vite, demo only). Use repo facts. "Public beta" → ? |
| LS6 | Old site: "Currently building Life Simulator" | S, possibly stale (last commit 2026-10-26) |

## Guardio (Junction X Vaasa)

| # | Fact | Status | Source |
|---|---|---|---|
| G1 | Family safety prototype: kids learn everyday home risks through short games; parents get 2-minute safety actions | V | old site; profile README |
| G2 | Live: https://guardioo.netlify.app/#/home | S (not fetched yet) | profile README |
| G3 | Code: Ar7ti/Junction-Hackaton ("safety-quest-source": React/TS, shadcn, bun; games ChooseAction, DecisionStory, RiskChain, SafeOrRisky, SpotTheRisk); 2 commits on 2026-10-03 | V | GitHub API |
| G4 | Team project | S | profile README. **Teammates and Kirill's exact part ?** |
| G5 | Stack per old site: JavaScript, HTML/CSS, Gemini AI | S | old site; repo is TypeScript |

## Other things found

| # | Fact | Source |
|---|---|---|
| X1 | Winter Toss (working title): Roblox winter throw-and-collect sim, Rojo + Wally + React-lua + ProfileStore, Luau strict, Lune tests; agent workflow; repo created 2026-11-18. Likely = "Throw Treats, Tame Pets!" ? | Ar7ti/Winter-Toss README, plan/GDD.md |
| X2 | Ai_FoodChecker (2026-10-15, JS + server.js, no README) | GitHub |
| X3 | heal_me / HealMe: Flutter health app, 3 commits, Oct 2026 | GitHub |
| X4 | Ticketmaster_autochecker_bot (Jul 2026): personal bot that checks resale ticket listings | its README |
| X5 | BlockfectTicketChecker_bot (Aug 2026, JS, no README) | GitHub |
| X6 | Study (Jul 2026), React (May–Jun 2026): early Roblox/Rojo learning repos | GitHub |
| X7 | web-portfolio (Jul–Oct 2026): source of the old "cosmic" site | GitHub |
| X8 | Junction Moments: **not found** on GitHub or the old site ? | search |
| X9 | YouTube channel content: unreadable ? | consent wall |

## Banned (no source)
"1000+ hours coding", "20+ technologies", "∞ ideas", "4+ months shipping" (old site). Never use.
