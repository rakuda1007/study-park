import type { ContentDoc } from "./types";

export type ContentPeriod = {
  year: number;
  month: number;
};

export const CONTENT_PERIOD_FILTER_ALL = "all";

export function currentContentPeriod(date = new Date()): ContentPeriod {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function contentPeriodFromIso(iso: string): ContentPeriod {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return currentContentPeriod();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function resolveContentPeriod(
  data: Pick<ContentDoc, "periodYear" | "periodMonth" | "createdAt">,
): ContentPeriod {
  const year = Number(data.periodYear);
  const month = Number(data.periodMonth);
  if (
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    month >= 1 &&
    month <= 12 &&
    year >= 2000 &&
    year <= 2100
  ) {
    return { year, month };
  }
  return contentPeriodFromIso(data.createdAt);
}

export function mapStoredContentPeriod(
  data: Record<string, unknown>,
  createdAtIso: string,
): ContentPeriod {
  return resolveContentPeriod({
    periodYear: Number(data.periodYear),
    periodMonth: Number(data.periodMonth),
    createdAt: createdAtIso,
  });
}

export type ContentPeriodRange = {
  start: ContentPeriod;
  end: ContentPeriod;
};

export function contentPeriodKey(period: ContentPeriod): string {
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

export function parseContentPeriodKey(key: string): ContentPeriod | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function contentPeriodToSortKey(period: ContentPeriod): number {
  return period.year * 12 + period.month;
}

export function normalizeContentPeriodRange(range: ContentPeriodRange): ContentPeriodRange {
  const startKey = contentPeriodToSortKey(range.start);
  const endKey = contentPeriodToSortKey(range.end);
  if (startKey <= endKey) return range;
  return { start: range.end, end: range.start };
}

export function contentPeriodRangeKey(range: ContentPeriodRange): string {
  const normalized = normalizeContentPeriodRange(range);
  return `${contentPeriodKey(normalized.start)}..${contentPeriodKey(normalized.end)}`;
}

/** 単月（旧形式）と開始..終了の両方を解釈 */
export function parseContentPeriodRangeKey(key: string): ContentPeriodRange | null {
  const rangeMatch = /^(\d{4}-\d{2})\.\.(\d{4}-\d{2})$/.exec(key);
  if (rangeMatch) {
    const start = parseContentPeriodKey(rangeMatch[1]);
    const end = parseContentPeriodKey(rangeMatch[2]);
    if (!start || !end) return null;
    return normalizeContentPeriodRange({ start, end });
  }
  const single = parseContentPeriodKey(key);
  if (!single) return null;
  return { start: single, end: single };
}

export function formatContentPeriod(period: ContentPeriod): string {
  return `${period.year}年${period.month}月`;
}

export function formatContentPeriodRange(range: ContentPeriodRange): string {
  const normalized = normalizeContentPeriodRange(range);
  const startLabel = formatContentPeriod(normalized.start);
  const endLabel = formatContentPeriod(normalized.end);
  if (startLabel === endLabel) return startLabel;
  return `${startLabel}〜${endLabel}`;
}

export function contentMatchesPeriodFilter(doc: ContentDoc, filter: string): boolean {
  if (filter === CONTENT_PERIOD_FILTER_ALL) return true;
  const range = parseContentPeriodRangeKey(filter);
  if (!range) return true;
  const normalized = normalizeContentPeriodRange(range);
  const key = contentPeriodToSortKey(resolveContentPeriod(doc));
  return (
    key >= contentPeriodToSortKey(normalized.start) &&
    key <= contentPeriodToSortKey(normalized.end)
  );
}

export function listContentPeriodOptions(
  docs: ContentDoc[],
): { value: string; label: string }[] {
  const seen = new Map<string, ContentPeriod>();
  for (const doc of docs) {
    const period = resolveContentPeriod(doc);
    const key = contentPeriodKey(period);
    if (!seen.has(key)) seen.set(key, period);
  }
  return [...seen.entries()]
    .sort(([, a], [, b]) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })
    .map(([value, period]) => ({ value, label: formatContentPeriod(period) }));
}

export function contentPeriodYearOptions(
  baseYear = new Date().getFullYear(),
  span = 6,
): number[] {
  const years: number[] = [];
  for (let y = baseYear + 1; y >= baseYear - span; y -= 1) {
    years.push(y);
  }
  return years;
}
