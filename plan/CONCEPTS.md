# CONCEPTS

Three directions + a shrunk moonshot. Prototypes live on branch `concepts/prototypes` in `concepts/` (open the HTML files directly, no build step). Each prototype only demonstrates the signature moment, not the whole site. Copy inside them is a draft (COPY.md comes in step 3) but uses only facts from FACTS.md.

The thread running through all of them comes from Kirill's own material: **waves**. His most-watched Shorts are Roblox tsunami waves (1.19M views), his game is 15 waves of enemies, and hackathons come in waves. Liquid is literally his subject, so the liquid motion is meaningful, not decoration.

---

## A. MOONSHOT: "Stud Tide"

**Idea.** The site is a living sea of Roblox-style studded voxels that moves like thick liquid: you stir it with the cursor, scroll sends waves through it, and each project rises out of the tide as an island.

**Why only Kirill.** Voxel studs = Roblox builder. A tsunami of blocks = the subject of his 2.6M-view Shorts. Islands rising = Sky Island Tower Defense. Remove his name and it's still unmistakably the portfolio of a Roblox creator who builds for the web.

**Signature liquid moment.** On load, one heavy wave of blocks rolls across the screen and settles like honey around the hero text, which stays standing on an island. Drag through the sea and the blocks slosh, overshoot and settle. Opening a case study sends a wave across the screen (liquid wipe) that recedes to reveal the page.

**10-second recruiter path.** The HTML hero is already rendered under the canvas: name, one line, proof strip, Open to, email button. The wave plays *around* the text, never over it. A "Skip the water" toggle in the corner = static layout.

**How projects are presented.** Each HERO case study is an island that rises from the tide when you scroll to it, with real media on its "surface". GRID projects are smaller floating blocks. ARCHIVE is a plain list at the "sea floor".

**Typography + palette.** Display: **Anybody** (variable width axis, so headlines can stretch and squash with the wave). Data/labels: **Martian Mono**. Daylight palette, not dark: sky `#DCEBF3`, deep water `#0E3B57`, stud teal `#1FA3A8`, foam `#F7FBFC`, signal yellow `#FFC933` for proof chips.

**Risk.** High. A three.js instanced voxel sea is heavy on low-end phones and easy to overdo into a "game gate". It needs a strong static fallback and careful GPU budgets. The most effort to reach 60 fps.

**Effort.** ~9–11 agent-days.

---

## A′. SHRUNK MOONSHOT: "Stud Tide Lite"

**Idea.** Keep the one magic moment (the voxel wave in the hero and the wave wipe into case studies), and drop the island world. The rest of the site is a calm editorial layout.

**What's cut.** No 3D islands per project, no scroll-driven sea across the whole page. The hero sea is a 2.5D fragment shader (one full-screen quad, no 3D geometry), so it's cheap on mobile.

**Signature liquid moment.** Same opening wave and cursor sloshing in the hero; the same wave becomes the case study transition.

**Effort.** ~6–7 agent-days. **Risk:** medium.

---

## B. REALISTIC: "Receipts"

**Idea.** A portfolio where every claim is a link that drips, like ink, into its proof: hover "won the Oxylabs challenge" and a thick drop stretches from the words to a receipt with the source.

**Why only Kirill.** His projects are about receipts: Shill or Chill's tagline is literally "We check the receipts", Ocean Radar shows a source for every answer. The rule "proof, not adjectives" becomes the interface. Remove the name and it's still the portfolio of the person who builds evidence tools.

**Signature liquid moment.** The hero is a pool of thick ink (metaballs) that follows the cursor with spring lag. Hovering any claim pulls a drop out of the pool. It stretches, necks, snaps onto the receipt and wobbles. Case studies open with an ink flood wipe.

**10-second recruiter path.** First screen is typographic: name, what he builds, three claims with receipts, Open to, email. Readable as plain HTML. The ink layer is pure decoration on top.

**How projects are presented.** Case studies are long "receipts": printed-paper columns with the brief, my part, the hardest decision, the result, each line with its source. GRID = smaller receipts, ARCHIVE = one ledger line each.

**Typography + palette.** Display: **Instrument Serif** (editorial, a little cheeky in italics). Body: **Schibsted Grotesk**. Receipts: **Martian Mono**. Paper `#F3EFE6`, ink `#121212`, verified highlighter `#C8F560`, a tiny receipt-red `#E2412E` for the "Open to" stamp.

**Risk.** Medium. Metaball ink is a well-known shader and cheap. The danger is that it reads as a "fact sheet" rather than wow, so motion quality carries it.

**Effort.** ~6–8 agent-days.

---

## C. FALLBACK: "Patch Notes"

**Idea.** Kirill's work written as game patch notes. He literally ships updates ("Update 1.1: Ember Update"), so his career is versioned the same way: v0.1 (2023) the channel, v0.5 the first Rojo repo, v1.0 Sky Island released, v1.1 Junction 2026.

**Why only Kirill.** He's a Roblox dev who ships game updates and makes Shorts for the same audience. Patch notes are his native format, not a borrowed metaphor.

**Signature liquid moment.** Gooey version pills that melt into each other as you scroll from release to release (SVG goo filter + spring physics). Headlines reveal through a liquid mask. No WebGL needed.

**10-second recruiter path.** "Latest release" at the top = who + proof + Open to + contact. Everything else is the changelog.

**How projects are presented.** Each project is a release entry: "Added / Fixed / Known issues" (an honest place for "in progress" and "what I'd do differently").

**Typography + palette.** Display: **Bricolage Grotesque** (variable, quirky). Mono: **Fragment Mono**. Off-white `#F6F5F1`, graphite `#1D1F22`, patch-orange `#FF6A2B`, mint `#5BD6A8` for "added".

**Risk.** Low. Cheapest, fastest, always 60 fps. The metaphor can feel like a dev joke if the copy is weak.

**Effort.** ~3–4 agent-days.

---

## Comparison

| | A Moonshot | A′ Shrunk | B Realistic | C Fallback |
|---|---|---|---|---|
| Uniqueness (no-name test) | very high | high | high | medium-high |
| Liquid wow | highest | high | high | medium |
| Risk to 60 fps / Lighthouse ≥ 90 | high | medium | low-medium | very low |
| Effort (agent-days) | 9–11 | 6–7 | 6–8 | 3–4 |
| Best for | game studios, Aalto | game studios + recruiters | recruiters, tech leads | everyone, quickly |

**My recommendation: A′ (Stud Tide Lite) with B's receipts as the content system.** The voxel wave is the moment nobody else can claim, and the receipts make every claim trace to its proof without extra effort. Effort ~7–8 days.
