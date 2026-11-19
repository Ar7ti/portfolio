# portfolio

Source of the portfolio site of Kirill Jegosin: games, web products and AI tools.

Built with [Astro](https://astro.build) (static output, TypeScript strict). Heavy visuals (the WebGL sea) load later as islands, so the page is plain HTML first and readable with JS off.

## Run it

Needs Node 22+.

```sh
npm install
npm run dev        # dev server on http://localhost:4321
npm run build      # static site in dist/
npm run preview    # serve dist/
```

## Check and test

```sh
npm run check      # astro check (types) + ESLint + Prettier
npm run format     # fix formatting
npx playwright install chromium   # once
npm run test       # Playwright: builds, serves, checks layout at 360/390/768/1440
```

## Fonts

Anybody (headings, big figures), Schibsted Grotesk (body) and Martian Mono (small labels only) are self-hosted from `public/fonts/`, all SIL OFL 1.1 (licenses next to the files). They are limited to the weights the design uses and subset to Latin. Only Anybody is preloaded, because it's the hero heading face.

To rebuild them (needs Python with `pip install fonttools brotli`):

```sh
npm run fonts
```

## Add a project

The content layer (typed data for projects, cases, timeline and archive) arrives in issue #4; this section will then describe the exact file to add. The rule already holds: **no number on the site without a source in `plan/FACTS.md`**, and copy comes from `plan/COPY.md`.

## How the work is organised

- `plan/` holds the planning files: `FACTS.md` (every claim with its source), `PROJECTS.md` (inventory and triage), `COPY.md`, `PLAN.md`, `DECISIONS.log`.
- `concepts/` holds the approved prototypes (`f-full-copy.html` = look, `d-day-to-night.html` = motion).
- Every task is a GitHub issue with acceptance criteria. One issue = one branch = one PR.
