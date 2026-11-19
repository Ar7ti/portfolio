# COPY

Status: **draft 1: hero + case 01 only**, waiting for Kirill's OK on the approach. The rest follows the same rules.
Every claim carries its FACTS.md id in `[brackets]`; brackets never ship.

## Rules (from Kirill's feedback, 2026-11-19)

1. **Skim test.** Someone who reads only the big text and the highlights still understands who Kirill is and what he did.
2. **Hero ≤ ~25 words** (name and email address not counted): headline + one line + 3 proof chips + email.
3. **Body text in a readable sans** (Schibsted Grotesk). Monospace (Martian Mono) only for small labels: kickers, dates, "receipt", "verified".
4. **Every block has one thing that pops**: numbers set large, key words in **bold** or the accent colour.
5. **Case studies ≤ 150 words.** One "in two words" line on top, then short blocks of 1–2 sentences, each starting with a **bold lead**. Lots of air between blocks.
6. Banned words and unsourced numbers per the brief. "Won the Oxylabs challenge", never "1st place" or "won Junction".

Type roles used below:
- `LABEL`: mono, small caps, muted (≈12 px)
- `H1` / `H2`: Anybody display
- `BIG`: Anybody, large figure (≈48–72 px)
- `LEAD`: sans, bold, start of a block
- `BODY`: sans, 17–18 px, max 60 characters per line
- `HL`: highlight (accent colour or bold) inside body

---

## Hero

```
LABEL   Kirill Jegosin · 18 · Kanta-Häme, Finland                       [P1 P2]

H1      I build games,
        web products
        & AI tools.

BODY    Open to internships, summer jobs & junior roles.                  [P11]

CHIPS   BIG "Won"   Oxylabs challenge · Junction 2026                     [H3]
        BIG "223"   commits on my solo Roblox game                        [ST10 ST9]
        BIG "2.6M"  views on my Roblox Shorts                             [YT2]

BUTTON  k.jegosin@gmail.com   [copy]                                      [P4]
LINKS   LinkedIn · GitHub · CV                                            (small, next to the button)
```

Word count: 7 (H1) + 7 (line) + 15 (chips) = **29**. To hit 25 exactly I can cut "on my" from two chips ("223 commits · solo Roblox game", "2.6M views · Roblox Shorts") → **25**. I'd keep the cut version.

Skim test: big text = "I build games, web products & AI tools" + "Won · 223 · 2.6M" + the email. ✔

---

## Case 01 · Shill or Chill

```
LABEL   Case 01 · Junction 2026 · 48-hour hackathon · Team of 4          [H1 SC8 H2]

H2      Shill or Chill

ONE-LINER (large body, 22–26 px)
        Paste a meme or post. See where it started,
        and whether its spread is **real or coordinated**.               [SC1]

RESULTS (3 big figures in a row)
        BIG "Won"   Oxylabs challenge                                     [H3]
        BIG "3rd"   Hostinger challenge                                   [H4]
        BIG "4"     builders + AI agents, one weekend                     [H2 SC8]

PHOTO   01-team-gemini-4-brain-cells, caption (LABEL):
        "Team Gemini 4 Brain Cells at Junction 2026"                      [M1 M2]

BLOCKS (LEAD + 1–2 sentences, generous spacing)

LEAD    My part.
BODY    I built the **coordination detector** and the pipeline that pulls
        **Bluesky posts** into our database.                              [SC5]

LEAD    Hardest call.
BODY    Friend groups and bots that say they're bots look coordinated too.
        I added **guards for both**, so the detector stays quiet on real
        communities.                                                      [SC5: commit "signals v1.6: guards for friend groups and openly automated services"] ⚠ confirm

LEAD    Proof it works.
BODY    Tested against **real Bluesky takedowns**, not our own examples.
        Then made detection **3–4× faster** with identical output.        [SC5 SC6]

LEAD    Next time.
BODY    ⚠ Kirill: one sentence, what you'd do differently.

LEAD    Team.
BODY    Justinas Launikonis, Temuulen Norovpel, Valtteri Pertilä (GitHub links). [SC9]

RECEIPTS (LABEL style, collapsed by default)
        verified · Oxylabs on LinkedIn: "Meet Shill or Chill, built by …"  [H3]
        source   · Hostinger 3rd: Kirill's LinkedIn post + comment under the Oxylabs post [H4]
        live     · noise-radar.srv2159172.hstgr.cloud                      [SC2]
        code     · github.com/JustinasLa/gemini-4-braincells               [H2]

CTA     Want someone who ships like this?  k.jegosin@gmail.com
```

Word count (one-liner + results + blocks, without receipts and labels): **~115** (+ about 15 once "Next time" is filled). ✔ ≤ 150.

Skim test: "Shill or Chill" → "real or coordinated" → "Won · 3rd · 4" → bold leads "My part / Hardest call / Proof it works" → "coordination detector", "real Bluesky takedowns", "3–4× faster". ✔

### Open questions for Kirill (case 01)
1. **Hardest call**: are the friend-group / bot guards the right decision to show, or was something else harder?
2. **Next time**: one honest sentence, what you'd do differently.
3. CTA line "Want someone who ships like this?": fits your voice, or too salesy?
