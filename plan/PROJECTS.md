# PROJECTS

Inventory + triage. Fact IDs (H3, ST10…) point to FACTS.md. "?" = waiting on Kirill.

Proof strength: 3 = live + public result · 2 = live or repo with a clear result · 1 = screenshots only · 0 = claim only.

## Inventory

| Project | What it is | Date | Status | Solo / team | Kirill's exact part | Stack | Real numbers (source) | Links | Media | Proof |
|---|---|---|---|---|---|---|---|---|---|---|
| **Shill or Chill** | Traces memes to their source and flags coordinated spread | 13–15 Nov 2026 (Junction 2026) | live | team of 4 | Coordination detector ("signals" v1→v1.10), Bluesky ingest pipeline, eval vs real Bluesky takedowns, METHODOLOGY.md (SC5) | Gemini, Nemotron VL, Oxylabs API, Postgres, Hostinger VPS, Codex | Oxylabs challenge win + 3rd Hostinger (H3/H4, S); 18/28 cascade, 1.5 s vs 12 s (SC4, team) | [live](https://noise-radar.srv2159172.hstgr.cloud) · [repo](https://github.com/JustinasLa/gemini-4-braincells) | none yet → screen capture task | 3 (2 until official result link) |
| **Sky Island Tower Defense** | Co-op Roblox tower defense: 4 players, 15 waves, Colossus boss | 23 May 2026 → now; published 25 Oct 2026 | live, updating (Ember Update 1.1) | solo | Everything: design, Luau, React-lua UI, server, data, Python playtest tools (ST9) | Luau, Rojo, React-lua, Python | 223 solo commits in ~6 months (ST10); 66 visits (ST4, too small to show) | [play](https://www.roblox.com/games/86140743290043/Sky-Island-Tower-Defense) · [code](https://github.com/Ar7ti/sky-island-td-showcase) | 2 screenshots in showcase repo; need gameplay loop recording | 3 |
| **Ocean Opportunity Radar** | Analyst workspace for ocean funds: AI finds evidence, humans confirm, every answer sourced | Oct 2026 | live (demo data) | solo | Everything; "AI never changes a score alone" rule; 36 tests (OR4) | React, TS, TanStack Start, OpenAI, Vitest, Cloudflare Workers | 36 tests (OR4) | [live](https://ocean-opportunity-radar.kirills-portfolio.workers.dev/) · [repo](https://github.com/Ar7ti/Ocean-Opportunity-Radar) | 4 screenshots in repo (hero, readiness, opportunities, mobile) | 2 |
| **Life Simulator** | AI copilot for big life moments: plan, budget, tasks | Oct 2026 (Junction X Turku, If challenge) | demo live; full version private | solo? | Backend with OpenAI, frontend, Playwright tests (profile README) | React, TS, Vite, Tailwind, Fastify, OpenAI | 32 solo commits (LS4) | [demo](https://ar7ti.github.io/life-simulator-demo/) | need screenshots | 2 |
| **Guardio** | Family safety: kids' mini-games + 2-minute actions for parents | Oct 2026 (Junction X Vaasa) | prototype, live | team (size ?) | ? | React/TS, Gemini | — | [live](https://guardioo.netlify.app/#/home) · [repo](https://github.com/Ar7ti/Junction-Hackaton) | old-site logo only | 2 (1 until role is known) |
| **Throw Treats, Tame Pets!** (= Winter Toss?) | Winter Roblox throw-and-collect sim | started 18 Nov 2026 | in progress | solo | Everything | Luau strict, Rojo, Wally, React-lua, ProfileStore, Lune tests | — | repo private? (Ar7ti/Winter-Toss is public) | none | 1 |
| **Junction Moments** | Fan web game about Junction 2026 memes ("140 BPM", "Printer Guy") | Nov 2026? | ? | ? | ? | ? | — | **not found** | ? | 0 |
| **YouTube Sharky_main** | Roblox videos | ? | ? | solo | ? | — | unreadable | [channel](https://www.youtube.com/@Sharky_main) | ? | 0 until read |
| Ai_FoodChecker | Unknown (JS + server, no README) | Oct 2026 | archived? | solo | — | JS, Node | — | repo | none | 1 |
| HealMe | Flutter health/sport app | Oct 2026 | archived | ? | — | Flutter/Dart | — | repo | none | 1 |
| Ticketmaster resale checker bot | Personal bot that finds cheaper resale tickets | Jul 2026 | shipped (for himself) | solo | Everything | ? | — | repo | none | 1 |
| Blockfect ticket checker bot | Ticket checker bot | Aug 2026 | archived | solo | — | JS | — | repo | none | 1 |
| Old portfolio (cosmic) | Previous site | Jul–Oct 2026 | replaced | solo | — | Next.js, Cloudflare | — | [site](https://home.kirills-portfolio.workers.dev/) | — | — |

## Triage (proposal — needs Kirill's yes)

**HERO (3 case studies)**
1. **Shill or Chill** — decided (brief §4). Strongest public result; Kirill's part is concrete and visible in commits.
2. **Sky Island Tower Defense** — decided. Solo, published, 223 commits, readable code showcase. The studio audience will love the showcase repo.
3. **Ocean Opportunity Radar** — my pick. Solo + live + public repo + 36 tests + a clear, mature design idea ("AI suggests, a human confirms"). Beats Life Simulator (demo uses fake data, full version private) and Guardio (role unknown).

**GRID (short cards)**: Life Simulator · Guardio · Throw Treats, Tame Pets! (in progress) · Junction Moments (if it exists and is live) · YouTube channel (if it has real content).

**ARCHIVE (one line each, collapsible)**: Ticket checker bots · Ai_FoodChecker · HealMe · early Roblox learning repos (Study, React) · old cosmic portfolio.

## Media tasks
- Shill or Chill: screen recording of a trace (10–15 s loop) + photo from Junction (consent of people shown).
- Sky Island TD: gameplay recording (placing towers, boss wave, ALL CLEAR), lobby, mobile.
- Ocean Radar: short recording of "confirm evidence → score moves".
- Life Simulator, Guardio: screenshots.
