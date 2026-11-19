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
npm run test       # Playwright: builds, serves, checks layout at 360/390/768/1440, JS off, reduced motion, facts
npx @lhci/cli autorun   # Lighthouse budgets, after npm run build
```

Every PR runs the same in GitHub Actions (`.github/workflows/ci.yml`): checks + Playwright, a lychee link check, and Lighthouse CI with hard budgets (mobile performance ≥ 90, accessibility ≥ 95, SEO ≥ 95, LCP < 2.5 s, CLS < 0.1). Set `PORT` to run Playwright next to another preview server.

## Fonts

Anybody (headings, big figures), Schibsted Grotesk (body) and Martian Mono (small labels only) are self-hosted from `public/fonts/`, all SIL OFL 1.1 (licenses next to the files). They are limited to the weights the design uses and subset to Latin. Only Anybody is preloaded, because it's the hero heading face.

To rebuild them (needs Python with `pip install fonttools brotli`):

```sh
npm run fonts
```

## Content and the facts rule

All copy lives in `src/content/` as YAML (Astro content collections, schemas in `src/content.config.ts`), transcribed from `plan/COPY.md`. Components never hard-code copy or numbers.

- `**word**` marks the one highlighted phrase (HL) of a line.
- **Every number needs a source.** A string with a number must sit in an object with `facts: [ids]` (ids from `plan/FACTS.md`, e.g. `[ST10]`), or with `nofacts: <reason>` when it isn't a claim ("404"). Unknown ids and unsourced numbers **fail `npm run build`**.
- Dated numbers carry `asOf: YYYY-MM-DD`; components render it as "as of 19 Nov 2026".
- On the page, every number must sit inside an element with `data-facts` or `data-nofacts` (the `Claim`, `BigFigures` and `Lead` components add them). `tests/facts.spec.ts` checks the built pages.

## Add a project

1. Add the facts to `plan/FACTS.md` first (one row per claim, with its source) and the copy to `plan/COPY.md`.
2. Card: add `src/content/projects/<name>.yaml` (template: `guardio.yaml`). Case study: add `src/content/cases/NN-<name>.yaml` (template: `01-shill-or-chill.yaml`). Small things go into `src/content/archive.yaml`, dated events into `src/content/timeline.yaml`.
3. Put media in `public/media/…` and reference it without the extension.
4. Run `npm run build && npm run test`: the build names any number that is missing a FACTS id.

## How the work is organised

- `plan/` holds the planning files: `FACTS.md` (every claim with its source), `PROJECTS.md` (inventory and triage), `COPY.md`, `PLAN.md`, `DECISIONS.log`.
- `concepts/` holds the approved prototypes (`f-full-copy.html` = look, `d-day-to-night.html` = motion).
- Every task is a GitHub issue with acceptance criteria. One issue = one branch = one PR.
