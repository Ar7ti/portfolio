# MOODBOARD

Screenshots: `plan/moodboard/<name>-1.jpg` (first screen) and `-2.jpg` (after a scroll), 1440×900, taken 2026-11-19. Gitignored: they are other people's work and never go into the public repo.

Rule: we take a **technique or a quality bar**, never a layout, asset, code or text.

| # | Site | What we take | Type |
|---|---|---|---|
| 1 | lusion.co | Cursor-driven fluid simulation that feels thick, not watery: damping and viscosity tuned so it lags behind the cursor. The bar for "liquid that is satisfying to play with" | motion |
| 2 | igloo.inc | Voxel/particle forms that dissolve and re-form on scroll. Proof that blocky geometry can feel soft and organic. Our voxel liquid starts here | motion / 3D |
| 3 | activetheory.net | Loader → scene handoff with no dead frame; scene transitions feel like one camera move. **Against:** its first screen is a loader, ours can't be | transition |
| 4 | bruno-simon.com | A portfolio you can play, built from the author's own world. **Against:** "click to start" gate. We take the "your own material is the concept" idea, never the gate | concept |
| 5 | robin-noguier.com | Images bend/skew with scroll velocity, a curved strip of case studies. Direct reference for "media that bends like liquid on scroll" | motion |
| 6 | dennissnellenberg.com | Magnetic buttons with spring overshoot, curved-edge page transition, giant name marquee. We take the magnetic springs and the curved wipe; not the name marquee or the portrait hero | micro-interaction / transition |
| 7 | cuberto.com | Mask-reveal headlines and a cursor that morphs into a blob over interactive things. Gooey cursor-to-button merge | micro-interaction |
| 8 | unseen.co | Soft pastel field with fluid gradient motion, playful character. **Against:** "Enter" gate. We take a light palette that still feels premium | palette |
| 9 | aristidebenoist.com | WebGL image strip with distortion on drag; extreme typographic restraint around one heavy effect | motion / layout discipline |
| 10 | basement.studio | Wireframe/pixel scenes plus confident, irreverent copy. Proof that a studio can be playful and credible at once. Voice reference | voice / 3D |
| 11 | darkroom.engineering | Authors of Lenis: smooth scroll that never fights native scroll. Brutal condensed display type in one signal colour | scroll / typography |
| 12 | locomotive.ca | Scroll-linked reveals timed to scroll position, not to time. Serif + grotesk pairing | scroll / typography |
| 13 | rauno.me | Micro-interactions polished to the last millisecond; one bold yellow shape on a calm page. Craft bar for small details (copy button, focus states) | craft |
| 14 | paco.me | The entire site readable in 10 seconds: plain columns of Building / Projects / Writing / Now. The bar for our "skip to the point" layer and the "Now" block | 10-second path |
| 15 | olivierlarose.com | Editorial serif lockup with ornaments; also publishes clean techniques for gooey/liquid text and mask effects | typography / technique |
| 16 | henryheffernan.com | A retro-computer portfolio. **Against:** "Click start to begin" before any content. Exactly the gate rule we forbid | anti-example |
| 17 | makemepulse.com | Staggered type composition on a dark field. **Against:** cookie banner covers the first screen, so we won't use third-party cookies at all | anti-example |
| 18 | immersive-g.com | Captured on its blank loading state at 7 s: another reminder that the first frame must already be content | anti-example |

## Patterns we take
- Liquid has to be **thick**: high damping, springy overshoot, slow settle (Lusion, Igloo).
- One heavy effect per screen, everything around it calm (Aristide, Rauno).
- Media reacts to scroll velocity, not just position (Robin).
- Magnetic and gooey micro-interactions on the things you can click (Dennis, Cuberto).
- Smooth scroll that never takes control away (Lenis / darkroom).

## Patterns we refuse
- Any gate before content: loader-first, "Enter", "Click to start" (5 of 18 references do it).
- Portrait-as-hero + giant name marquee (Dennis): fine for a designer, wrong for a builder whose proof is shipped work.
- Logo walls (basement's client wall): we have no clients, and logo walls are on our anti-list anyway.
- Dark-everything + glass cards.
