/** Escapes HTML, then turns `**word**` into `<b>word</b>` (the HL role). Nothing else is markup. */
export function rich(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

/** Plain text without the `**` marks (for alt text, meta tags, aria labels). */
export function plain(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1');
}
