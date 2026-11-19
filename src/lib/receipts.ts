/**
 * Claim → receipt matching. A claim links to the first receipt that shares one of its
 * FACTS.md ids (verified receipts first), so links follow the data, not hand-wired ids.
 */
export interface ReceiptRef {
  href: string;
  kind: string;
}

interface Receipt {
  kind: string;
  facts: readonly string[];
}

const RANK: Record<string, number> = { verified: 0, source: 1, live: 2, code: 3 };

export const receiptId = (slug: string, index: number) => `${slug}-receipt-${index + 1}`;

export function matchReceipt(
  slug: string,
  facts: readonly string[] | undefined,
  receipts: readonly Receipt[] | undefined,
): ReceiptRef | undefined {
  if (!facts?.length || !receipts?.length) return undefined;
  const hits = receipts
    .map((receipt, index) => ({ receipt, index }))
    .filter(({ receipt }) => receipt.facts.some((id) => facts.includes(id)))
    .sort((a, b) => (RANK[a.receipt.kind] ?? 9) - (RANK[b.receipt.kind] ?? 9));
  const best = hits[0];
  return best ? { href: `#${receiptId(slug, best.index)}`, kind: best.receipt.kind } : undefined;
}
