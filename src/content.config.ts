/**
 * Content collections. Copy comes from plan/COPY.md, every claim carries FACTS.md ids.
 * The build fails if a number has no FACTS id or an id doesn't exist (see src/content/facts.ts).
 */
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { factIds, findFactProblems } from './content/facts';

const ids = factIds();
const factId = z.string().refine((id) => ids.has(id), { message: 'Unknown FACTS.md id' });
const facts = z.array(factId);

/** A piece of copy. `**word**` marks the HL. */
const claim = z.strictObject({
  text: z.string(),
  facts: facts.default([]),
  /** Why a number here needs no FACTS id (e.g. "HTTP status code"). */
  nofacts: z.string().optional(),
  /** Kirill's own statement (plan/COPY.md marks these [Kirill]). */
  source: z.literal('Kirill').optional(),
});

const figure = z.strictObject({
  value: z.string(),
  label: z.string(),
  note: z.string().optional(),
  facts: facts.min(1),
  asOf: z.coerce.date().optional(),
  highlight: z.boolean().optional(),
});

const lead = z.strictObject({
  lead: z.string(),
  text: z.string(),
  facts: facts.default([]),
  source: z.literal('Kirill').optional(),
  people: z.array(z.strictObject({ name: z.string(), href: z.url() })).optional(),
});

const link = z.strictObject({
  label: z.string(),
  href: z.string(),
  facts: facts.optional(),
});

const image = z.strictObject({
  /** Path without extension: the files are `<src>-sm.webp`, `-lg.webp`, `-full.webp` (+ .jpg) or `<src>.webp`. */
  src: z.string().startsWith('/media/'),
  alt: z.string().min(1),
  caption: claim.optional(),
  size: z.enum(['large', 'small']).optional(),
  href: z.url().optional(),
  facts: facts.optional(),
});

const short = z.strictObject({
  kind: z.literal('short'),
  href: z.url(),
  label: z.string(),
  facts: facts.min(1),
});

/** Runs the "no number without a FACTS id" rule on a whole entry. */
function sourced<T extends z.ZodType>(schema: T) {
  return schema.superRefine((data, ctx) => {
    for (const problem of findFactProblems(data, ids)) {
      ctx.addIssue({ code: 'custom', message: `${problem.path}: ${problem.message}` });
    }
  });
}

const contactId = z.enum(['email', 'linkedin', 'github', 'cv', 'telegram']);

const site = defineCollection({
  loader: file('src/content/site.yaml'),
  schema: sourced(
    z.strictObject({
      title: z.string(),
      description: claim,
      og: z.strictObject({ title: z.string(), description: z.string(), facts: facts.min(1) }),
      nav: z.array(z.strictObject({ label: z.string(), href: z.string() })),
      skipLink: z.string(),
      motionToggle: z.strictObject({ calm: z.string(), back: z.string() }),
      footer: z.strictObject({
        code: z.strictObject({ text: z.string(), label: z.string(), href: z.url() }),
        checked: claim,
        checkedOn: z.coerce.date(),
      }),
      hero: z.strictObject({
        label: claim,
        h1: z.array(z.string()).min(1),
        line: claim,
        chips: z.array(figure).length(3),
        contacts: z.array(contactId),
      }),
      contact: z.strictObject({
        label: z.string(),
        h2: z.string(),
        line: claim,
        contacts: z.array(contactId),
        small: z.array(claim),
      }),
      more: z.strictObject({ label: z.string(), h2: z.string() }),
      timeline: z.strictObject({
        label: z.string(),
        h2: z.string(),
        /** Tag on the row marked `next` (Aalto 2027). */
        next: z.string(),
      }),
      notFound: z.strictObject({
        label: claim,
        h1: z.string(),
        body: z.string(),
        button: z.strictObject({ label: z.string(), href: z.string() }),
      }),
      copyEmail: z.strictObject({ button: z.string(), done: z.string(), status: z.string() }),
      cta: z.string(),
      /** Receipts list: summary text, "checked <date>" word, screen-reader prefix for claim marks. */
      receipts: z.strictObject({ summary: z.string(), checked: z.string(), markLabel: z.string() }),
    }),
  ),
});

const contacts = defineCollection({
  loader: file('src/content/contacts.yaml'),
  schema: sourced(
    z.strictObject({
      id: contactId,
      label: z.string(),
      labelLong: z.string().optional(),
      display: z.string().optional(),
      href: z.string().optional(),
      copy: z.boolean().optional(),
      status: z.literal('pending').optional(),
      note: z.string().optional(),
      facts: facts.default([]),
    }),
  ),
});

/**
 * A muted gameplay loop. Files: `<src>.webm` and/or `<src>.mp4` in public/.
 * Until they exist the poster image is shown in the same slot (no layout change when the video lands).
 */
const video = z.strictObject({
  kind: z.literal('video'),
  src: z.string().startsWith('/media/'),
  poster: z.string().startsWith('/media/'),
  alt: z.string().min(1),
  caption: claim.optional(),
  facts: facts.optional(),
});

const caseBody = {
  media: z.array(z.union([image, short, video])),
  blocks: z.array(lead),
  links: z.array(link),
};

const cases = defineCollection({
  loader: glob({ pattern: '*.yaml', base: 'src/content/cases' }),
  schema: sourced(
    z.strictObject({
      order: z.number().int(),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      theme: z.enum(['day', 'dusk', 'night']),
      label: claim,
      title: z.string(),
      oneliner: claim,
      results: z.array(figure).length(3),
      ...caseBody,
      subprojects: z
        .array(z.strictObject({ title: z.string(), oneliner: claim, ...caseBody }))
        .optional(),
      receipts: z
        .array(
          z.strictObject({
            kind: z.enum(['verified', 'source', 'live', 'code']),
            text: z.string(),
            href: z.url(),
            facts: facts.min(1),
          }),
        )
        .optional(),
    }),
  ),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: 'src/content/projects' }),
  schema: sourced(
    z.strictObject({
      order: z.number().int(),
      title: z.string(),
      label: claim,
      asOf: z.coerce.date().optional(),
      status: z.enum(['in-progress', 'live', 'closed']).optional(),
      big: figure.optional(),
      row: claim.optional(),
      body: z.array(claim),
      blocks: z.array(lead).optional(),
      media: z.array(image).optional(),
      links: z.array(link),
    }),
  ),
});

const hackathons = defineCollection({
  loader: file('src/content/hackathons.yaml'),
  schema: sourced(
    z.strictObject({
      id: z.string(),
      label: claim,
      title: claim,
      rows: z.array(
        z.strictObject({
          event: z.string(),
          month: z.string(),
          project: z.string(),
          team: z.string(),
          result: z.string().optional(),
          highlight: z.boolean().optional(),
          facts: facts.min(1),
        }),
      ),
      photo: image,
    }),
  ),
});

const timeline = defineCollection({
  loader: file('src/content/timeline.yaml'),
  schema: sourced(
    z.strictObject({
      id: z.string(),
      order: z.number().int(),
      when: z.string(),
      text: z.string(),
      facts: facts.min(1),
      emphasis: z.boolean().optional(),
      next: z.boolean().optional(),
    }),
  ),
});

const archive = defineCollection({
  loader: file('src/content/archive.yaml'),
  schema: sourced(
    z.strictObject({
      id: z.string(),
      summary: z.string(),
      items: z.array(
        z.strictObject({
          name: z.string(),
          year: z.string(),
          text: z.string(),
          tag: z.enum(['paused', 'planned']).optional(),
          link: z.strictObject({ label: z.string(), href: z.url() }).optional(),
          facts: facts.min(1),
        }),
      ),
    }),
  ),
});

export const collections = { site, contacts, cases, projects, hackathons, timeline, archive };
