import { formatStudyDate, parseStudyDate } from "./week";

export const DEFAULT_SPAN_DAYS = 7;
export const MIN_SPAN_DAYS = 1;
export const MAX_SPAN_DAYS = 31;
export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export const STUDY_VIEW_INPUT_ERROR = "1〜31の整数で指定してください。";

/** 学習管理の表示期間。anchorDate が無いときは標準の曜日始まり */
export type StudyViewSettings = {
  /** 指定した日付からの期間。無いときは標準に合わせる */
  anchorDate?: string;
  spanDays: number;
  /** 0=日曜 … 6=土曜 */
  standardWeekday: number;
  standardSpanDays: number;
};

export const DEFAULT_STUDY_VIEW: StudyViewSettings = {
  spanDays: DEFAULT_SPAN_DAYS,
  standardWeekday: 0,
  standardSpanDays: DEFAULT_SPAN_DAYS,
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function isValidAnchorDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return formatStudyDate(parseStudyDate(value)) === value;
}

export function parseSpanDays(raw: string): number | null {
  const spanText = raw.trim();
  if (!/^\d+$/.test(spanText)) return null;
  const spanDays = Number(spanText);
  if (!Number.isInteger(spanDays) || spanDays < MIN_SPAN_DAYS || spanDays > MAX_SPAN_DAYS) {
    return null;
  }
  return spanDays;
}

function readSpanDays(value: unknown, fallback: number): number {
  const span = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(span) || span < MIN_SPAN_DAYS || span > MAX_SPAN_DAYS) return fallback;
  return span;
}

function readWeekday(value: unknown): number {
  const weekday = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return 0;
  return weekday;
}

export function normalizeStudyViewSettings(raw: unknown): StudyViewSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_STUDY_VIEW };
  const data = raw as {
    anchorDate?: unknown;
    spanDays?: unknown;
    standardWeekday?: unknown;
    standardSpanDays?: unknown;
  };
  const standardWeekday = readWeekday(data.standardWeekday);
  const standardSpanDays = readSpanDays(data.standardSpanDays, DEFAULT_SPAN_DAYS);
  const anchor = typeof data.anchorDate === "string" ? data.anchorDate : "";
  const spanDays = readSpanDays(data.spanDays, standardSpanDays);
  if (!isValidAnchorDate(anchor)) {
    return { standardWeekday, standardSpanDays, spanDays: standardSpanDays };
  }
  return { anchorDate: anchor, spanDays, standardWeekday, standardSpanDays };
}

export function isFactoryDefault(settings: StudyViewSettings): boolean {
  return (
    !settings.anchorDate &&
    settings.standardWeekday === 0 &&
    settings.standardSpanDays === DEFAULT_SPAN_DAYS &&
    settings.spanDays === DEFAULT_SPAN_DAYS
  );
}

/** 表示中の区切りが日曜始まり・7日のとき、週の文言を使う */
export function usesWeekLabels(settings: StudyViewSettings): boolean {
  if (settings.spanDays !== DEFAULT_SPAN_DAYS) return false;
  if (!settings.anchorDate) return settings.standardWeekday === 0;
  return parseStudyDate(settings.anchorDate).getDay() === 0;
}

export function formatStandardLabel(weekday: number, spanDays: number): string {
  const name = WEEKDAY_LABELS[weekday] ?? "日";
  return `${name}曜始まり・${spanDays}日間`;
}

/** 2024-01-07 は日曜。曜日ごとの区切りがずれない基準日 */
function weekdayAnchor(weekday: number): Date {
  return addDays(new Date(2024, 0, 7), weekday);
}

function alignToAnchor(anchor: Date, date: Date, spanDays: number): Date {
  const index = Math.floor(daysBetween(anchor, date) / spanDays);
  return addDays(anchor, index * spanDays);
}

/** 指定日を含む表示期間の開始日 */
export function getPeriodStart(date: Date, settings: StudyViewSettings): Date {
  if (!settings.anchorDate) {
    return alignToAnchor(weekdayAnchor(settings.standardWeekday), date, settings.spanDays);
  }
  return alignToAnchor(startOfDay(parseStudyDate(settings.anchorDate)), date, settings.spanDays);
}

/** 表示期間の終わり（その日の終わり） */
export function getPeriodEnd(periodStart: Date, spanDays: number): Date {
  const d = addDays(periodStart, Math.max(1, spanDays) - 1);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function shiftPeriod(periodStart: Date, spanDays: number, delta: number): Date {
  return addDays(periodStart, delta * spanDays);
}

export function periodContains(periodStart: Date, spanDays: number, date: Date): boolean {
  const start = startOfDay(periodStart);
  const end = addDays(start, spanDays - 1);
  const day = startOfDay(date);
  return day.getTime() >= start.getTime() && day.getTime() <= end.getTime();
}

/** 期間ナビ用の短い表記（例: 10/13〜22、年またぎは 2026/12/28〜2027/1/3） */
export function formatViewPeriodLabel(
  periodStart: Date,
  spanDays: number,
  today = new Date(),
): string {
  const start = startOfDay(periodStart);
  if (spanDays <= 1) return formatSingleDate(start, today);
  const end = addDays(start, spanDays - 1);
  if (start.getFullYear() !== end.getFullYear()) {
    return `${formatYmdSlash(start)}〜${formatYmdSlash(end)}`;
  }
  const range = formatMonthDayRange(start, end);
  if (start.getFullYear() !== today.getFullYear()) return `${start.getFullYear()}/${range}`;
  return range;
}

export function parseStudyViewInput(
  anchorDate: string,
  spanDaysRaw: string,
): { anchorDate: string; spanDays: number } | null {
  const spanDays = parseSpanDays(spanDaysRaw);
  if (spanDays === null) return null;
  if (!isValidAnchorDate(anchorDate.trim())) return null;
  return { anchorDate: anchorDate.trim(), spanDays };
}

function formatSingleDate(date: Date, today: Date): string {
  const md = `${date.getMonth() + 1}/${date.getDate()}`;
  if (date.getFullYear() !== today.getFullYear()) return `${date.getFullYear()}/${md}`;
  return md;
}

function formatYmdSlash(date: Date): string {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function formatMonthDayRange(start: Date, end: Date): string {
  const sm = start.getMonth() + 1;
  const sd = start.getDate();
  const em = end.getMonth() + 1;
  const ed = end.getDate();
  if (sm === em) return `${sm}/${sd}〜${ed}`;
  return `${sm}/${sd}〜${em}/${ed}`;
}
