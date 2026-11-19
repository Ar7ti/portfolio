import { getEntry, type CollectionKey, type DataEntryMap } from 'astro:content';

/** Loads one content entry's data or fails the build with a clear message. */
export async function data<C extends CollectionKey>(
  collection: C,
  id: string,
): Promise<DataEntryMap[C][string]['data']> {
  const entry = await getEntry(collection, id);
  if (!entry) throw new Error(`Content entry "${collection}/${id}" is missing`);
  return entry.data as DataEntryMap[C][string]['data'];
}
