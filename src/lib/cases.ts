import { getCollection, type CollectionEntry } from 'astro:content';

export type CaseData = CollectionEntry<'cases'>['data'];

/** All cases in their `order`. */
export async function cases(): Promise<CaseData[]> {
  return (await getCollection('cases')).map((e) => e.data).sort((a, b) => a.order - b.order);
}

/** One case by slug, or fail the build. */
export async function caseBySlug(slug: string): Promise<CaseData> {
  const found = (await cases()).find((c) => c.slug === slug);
  if (!found) throw new Error(`No case with slug "${slug}" in src/content/cases`);
  return found;
}
