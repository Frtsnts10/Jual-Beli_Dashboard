/** Page sizes every table offers. */
export const PAGE_SIZES = [5, 10, 50, 100] as const;

/**
 * Reads ?page= & ?size= (1-based page; size limited to PAGE_SIZES) and slices `items`.
 * The page is clamped, so a stale ?page= after a filter change still shows rows.
 */
export function paginate<T>(items: T[], sp: { page?: string; size?: string }, defaultSize = 10) {
  const sizeNum = Number(sp.size);
  const size = (PAGE_SIZES as readonly number[]).includes(sizeNum) ? sizeNum : defaultSize;
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(Math.max(1, Math.floor(Number(sp.page)) || 1), pages);
  return { rows: items.slice((page - 1) * size, page * size), page, size, pages, total: items.length };
}
