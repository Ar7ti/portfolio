# COPY

Status: **draft 2: complete**. Hero and case 01 approved by Kirill (2026-11-19). Everything else waits for review.
Every claim carries its FACTS.md id in `[brackets]`; brackets never ship. `⚠` = needs Kirill's answer before build.
Mock of every section: `concepts/f-full-copy.html` on branch `concepts/prototypes`.

## Rules (Kirill's feedback, 2026-11-19)

1. **Skim test.** Someone who reads only the big text and the highlights still understands who Kirill is and what he did.
2. **Hero ≤ ~25 words** (name and email address not counted): headline + one line + 3 proof chips + email.
3. **Body text in a readable sans** (Schibsted Grotesk). Monospace (Martian Mono) only for small labels: kickers, dates, "receipt", "verified".
4. **Every block has one thing that pops**: numbers large, key words **bold** or in the accent colour.
5. **Case studies ≤ 150 words.** One "in two words" line on top, then 1–2 sentence blocks with a **bold lead**, lots of air.
6. Banned words and unsourced numbers per the brief. "Won the Oxylabs challenge", never "1st place" or "won Junction".
7. Dated numbers carry "as of" in a label (YouTube, commits).

Type roles: `LABEL` mono small · `H1/H2` Anybody · `BIG` Anybody figure · `LEAD` bold sans · `BODY` sans 17–18 px · `HL` bold/accent.

---

## 0. Global

```
<title>         Kirill Jegosin · games, web products & AI tools
meta desc       18-year-old builder from Finland. Won the Oxylabs challenge at Junction 2026, shipped a solo Roblox game. Open to internships and junior roles.
OG title        Kirill Jegosin
OG desc         I build games, web products & AI tools. Won the Oxylabs challenge at Junction 2026.
NAV             Work · Hackathons · Timeline · Contact
SKIP LINK       Skip to the point          (jumps to the static summary + contacts)
MOTION TOGGLE   Calm the water / Bring the water back
FOOTER          This site's code is public → github.com/Ar7ti/portfolio · Numbers checked 19 Nov 2026
```

---

## 1. Hero ✔ approved

```
LABEL   Kirill Jegosin · 18 · Kanta-Häme, Finland                       [P1 P2]
H1      I build games, / web products / & AI tools.
BODY    Open to **internships, summer jobs & junior roles**.              [P11]
CHIPS   BIG "Won"   Oxylabs challenge · Junction 2026                     [H3]
        BIG "223"   commits · solo Roblox game                            [ST10 ST9]
        BIG "2.6M"  views · Roblox Shorts                                 [YT2]
BUTTON  k.jegosin@gmail.com  [Copy]   ·  LinkedIn · GitHub · CV           [P4 P5 P6]
```
25 words.

---

## 2. Case 01 · Shill or Chill ✔ approved

```
LABEL   Case 01 · Junction 2026 · 48-hour hackathon · Team of 4          [H1 SC8 H2]
H2      Shill or Chill
ONE     Paste a meme or post. See where it started, and whether its spread is **real or coordinated**.   [SC1]
RESULTS BIG "Won"   Oxylabs challenge                                     [H3]
        BIG "3rd"   Hostinger challenge                                   [H4]
        BIG "3–4×"  faster detection, same output                         [SC6]  (Kirill's own result)
PHOTO   01-team-gemini-4-brain-cells · LABEL "Team Gemini 4 Brain Cells · Junction 2026"   [M1 M2]
PHOTO 2 02-team-building-at-tables (small, below) · LABEL "Building, night one · Photo: Junction"   [M3 M4]

LEAD My part.        I built the **coordination detector** and the pipeline that pulls **Bluesky posts** into our database.   [SC5]
LEAD Hardest call.   Friend groups and bots that say they're bots look coordinated too. I added **guards for both**, so real communities don't get flagged.   [SC5]
LEAD Proof it works. Tested against **real Bluesky takedowns**, not our own examples.   [SC5]
LEAD Next time.      Start the **demo on day one**, not the last night.    [Kirill]
LEAD Team.           Justinas Launikonis, Temuulen Norovpel, Valtteri Pertilä (GitHub links).   [SC9]

RECEIPTS (4)  verified · Oxylabs on LinkedIn: "Meet Shill or Chill, built by …"   [H3]
              source   · Hostinger 3rd: my LinkedIn post + a comment under the Oxylabs post   [H4]
              live     · noise-radar.srv2159172.hstgr.cloud            [SC2]
              code     · github.com/JustinasLa/gemini-4-braincells     [H2]
CTA     Want to build something together?  [k.jegosin@gmail.com]
```
"3–4× faster" moved from the proof block to the big figures, so the block is shorter. ~105 words.

---

## 3. Case 02 · Sky Island Tower Defense

```
LABEL   Case 02 · Roblox · Solo · May–Nov 2026                          [ST10]
H2      Sky Island Tower Defense
ONE     A co-op tower defense on Roblox. **Up to 4 players** hold a floating island against **15 waves** and a boss.   [ST5 ST6]
RESULTS BIG "Live"  published on Roblox, 25 Oct 2026                      [ST1 ST2]
        BIG "223"   commits, all mine · as of 18 Nov 2026                 [ST10]
        BIG "1.1"   Ember Update: new map, new season                     [ST7]
MEDIA   sky-island-map (large) + sky-island-all-clear (small) + Short "ALL TOWERS VS COLOSSUS" (link)   [ST13]

LEAD My part.        **Everything**: game design, all the Luau code, the UI in React-lua.   [ST9]
LEAD Hardest call.   **The server decides.** The player only asks to place a tower; the server checks the spot and takes the cash first.   [ST12 showcase README] ⚠ confirm this is the hardest call
LEAD Proof it works. My **Python scripts drive Roblox Studio**: they play a match, try bad placements, check phone layouts and measure frame times.   [ST12 showcase README]
LEAD Next time.      ⚠ Kirill: one sentence.
LEAD Code.           Waves, enemy movement and the UI are **public**. Combat and economy stay private, so cheaters can't read them.   [ST12]

LINKS   Play on Roblox · Read the code
CTA     Want to build something together?  [k.jegosin@gmail.com]
```
~110 words (+ "Next time").

---

## 4. Case 03 · Junction X Turku: two solo projects

```
LABEL   Case 03 · Junction X Turku · Solo · Oct 2026                    [H8]
H2      Two solo projects. One hackathon.
ONE     At Junction X Turku I built **two products alone**: one for ocean investors, one for big life decisions.   [H8]
RESULTS BIG "2"     solo projects, one weekend                            [H8]
        BIG "2"     partner challenges: A'Pelago / Redstone and If        [H8 H9 LS2]
        BIG "36"    tests in Ocean Radar                                  [OR4]

SUB-H   Ocean Opportunity Radar                                           MEDIA ocean-radar-hero
ONE     Helps ocean funds decide the next step with a startup. **Every answer has a source.**   [OR1]
LEAD Hardest call.   AI can find evidence, but it **never changes a score alone**. A person confirms first.   [OR1]
LEAD Proof it works. If the AI quotes a pitch, **the quote must really be in the text**, or it's rejected.   [Ocean README]
LINKS   Live demo · Code

SUB-H   Life Simulator                                                    MEDIA life-simulator-demo
ONE     An AI copilot for big life moves: a new city, a first car, a trip. It makes a **plan, a budget and tasks**.   [LS1]
LEAD My part.        Backend with OpenAI, frontend and Playwright tests. **Closed now**; the demo runs on example data.   [LS4 LS5]
LINKS   Demo · Video

LEAD Next time.      ⚠ Kirill: one sentence for the Turku weekend.
CTA     Want to build something together?  [k.jegosin@gmail.com]
```
~130 words (+ "Next time").

---

## 5. Hackathons strip (the night section opens here)

```
LABEL   Hackathons · 2026
H2      3 hackathons. 4 projects.                                         [H10]
ROW     Junction X Vaasa · Oct · Guardio · team
        Junction X Turku · Oct · Ocean Radar + Life Simulator · solo
        Junction 2026 · Nov · Shill or Chill · **won the Oxylabs challenge**
PHOTO   04-main-hall-wide as section background (dark scrim on the text side) · LABEL "Junction 2026, Espoo · Photo: Junction"   [M3 M4]
```

---

## 6. Cards (GRID)

**YouTube: Sharky_blox**
```
LABEL   YouTube · Roblox Shorts · since 2023 · as of 19 Nov 2026        [P8]
BIG     2.6M views                                                        [YT2]
ROW     9.95K subscribers · 33 Shorts                                     [YT1]
BODY    My top Short has **1.19M views**. Same audience my games are for.   [YT3]
MEDIA   3 Short covers: 1.19M · 412K · 172K                               [YT3 YT4 YT5]
LINK    Watch on YouTube
```

**Guardio**
```
LABEL   Junction X Vaasa · Team of 4 · Oct 2026                          [H7 G4]
H3      Guardio
BODY    Kids spot home risks in **mini-games**. Parents get **2-minute** safety checks.   [G1]
BODY    **My part:** most of the web app. Two of us coded; we split the rest **50/50**.   [G4]
LINKS   Live · Code
```

**Throw Treats, Tame Pets!** (also the "Now building" block)
```
LABEL   Now building · updated 19 Nov 2026 · IN PROGRESS                 [X1]
H3      Throw Treats, Tame Pets!
BODY    A Roblox game: **throw treats**, tame the pets that land, grow your yard.   [X1]
LEAD Works now.  ⚠ Kirill
LEAD Next.       ⚠ Kirill
```

---

## 7. Timeline

```
LABEL   Timeline
H2      What I shipped, when.
2023 May      Started **Sharky_blox**, a Roblox Shorts channel             [P8]
2025          Started **ICT at LHKK**                                      [P3]
2026 Apr      A Short hits **1.19M views**                                 [YT3]
2026 May      First commit on my **tower defense** game                    [ST10]
2026 Oct      Junction X Vaasa: **Guardio**                                [H7]
2026 Oct      Junction X Turku: **2 solo projects**                        [H8]
2026 Oct 25   **Sky Island Tower Defense** goes live on Roblox             [ST2]
2026 Nov 13–15 Junction 2026: **won the Oxylabs challenge**                [H3 H1]
2026 Nov      Building **Throw Treats, Tame Pets!**                        [X1]
2027          Applying to **Aalto University**                             [P12]  (styled as "next", dashed)
```

---

## 8. Archive (collapsed by default)

```
SUMMARY  More small things I built (6)
- Resale ticket checker bot · 2026 · finds cheaper resale concert tickets for me · Code   [X4]
- Blockfect ticket checker bot · 2026 · ⚠ one line · Code                [X5]
- AI Food Checker · 2026 · ⚠ one line · Code                              [X2]
- HealMe · 2026 · Flutter health app prototype · ⚠ school project or own? · Code   [X3]
- First Roblox experiments · 2026 · learning Rojo and React-lua           [X6]
- Old portfolio · 2026 · the site this one replaced · Visit               [X7]
```

---

## 9. Contact

```
LABEL   Contact
H2      Let's build something.
BODY    Open to **internships, summer jobs & junior roles**. Remote, or on-site **within ~1 hour of Forssa**.   [P11]
BUTTON  k.jegosin@gmail.com  [Copy]                                      [P4]
LINKS   LinkedIn · GitHub · CV (PDF) · Telegram                          [P6 P5 P7]
SMALL   ICT student at LHKK, 2025–2027 · Applying to Aalto University in 2027 · Kanta-Häme, Finland   [P3 P12 P2]
```

---

## 10. 404

```
LABEL   404
H1      This island sank.
BODY    The page you wanted isn't here.
BUTTON  Back to the surface   ·   k.jegosin@gmail.com
```

---

## Open questions for Kirill
1. **Sky Island, hardest call**: "the server decides everything" (from your showcase README). Right, or something else?
2. **Sky Island, next time**: one sentence.
3. **Turku, next time**: one sentence for the weekend with two solo projects.
4. **Throw Treats**: what works now, what's next (one line each).
5. **Archive**: one line each for Blockfect bot and AI Food Checker; is HealMe a school project?
6. **CV**: we build it from scratch. I'll send a separate list of questions after the copy is approved.
