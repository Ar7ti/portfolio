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
