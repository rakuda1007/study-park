import { contentMatchesPeriodFilter } from "./period";
import type { ContentDoc } from "./types";

export const CONTENT_PINNED_SECTION_KEY = "pinned";
export const CONTENT_PINNED_SECTION_LABEL = "常設";

export function isContentPinned(doc: Pick<ContentDoc, "pinned">): boolean {
  return doc.pinned === true;
}

export function splitPinnedContents<T extends Pick<ContentDoc, "pinned" | "order">>(
  items: T[],
): { pinned: T[]; regular: T[] } {
  const pinned: T[] = [];
  const regular: T[] = [];
  for (const item of items) {
    if (isContentPinned(item)) pinned.push(item);
    else regular.push(item);
  }
  pinned.sort((a, b) => a.order - b.order);
  return { pinned, regular };
}

/** 期間フィルター適用後も常設は含める */
export function filterContentsForDisplay<T extends ContentDoc>(
  items: T[],
  periodFilter: string,
): T[] {
  const { pinned, regular } = splitPinnedContents(items);
  return [
    ...pinned,
    ...regular.filter((item) => contentMatchesPeriodFilter(item, periodFilter)),
  ];
}

export function countContentsForDisplay<T extends ContentDoc>(
  items: T[],
  periodFilter: string,
): number {
  return filterContentsForDisplay(items, periodFilter).length;
}
