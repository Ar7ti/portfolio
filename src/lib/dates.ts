const FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "19 Nov 2026": the one date format for "as of" stamps and "Numbers checked". */
export function formatDate(date: Date): string {
  return FORMAT.format(date);
}

export function asOf(date: Date): string {
  return `as of ${formatDate(date)}`;
}

/**
 * Fills the `{asOf}` slot in a content label with the entry's date
 * ("updated {asOf}" → "updated 19 Nov 2026"), with non-breaking spaces so the date never splits.
 */
export function fillAsOf<T extends { text: string }>(claim: T, date: Date | undefined): T {
  if (!claim.text.includes('{asOf}')) return claim;
  if (!date) throw new Error(`"${claim.text}" has an {asOf} slot but the entry has no asOf date`);
  const stamp = formatDate(date).replaceAll(' ', ' ');
  return { ...claim, text: claim.text.replaceAll('{asOf}', stamp) };
}
