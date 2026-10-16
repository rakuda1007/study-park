import { formatStudyDate, getWeekStart, parseStudyDate } from "./week";

export const DEFAULT_SPAN_DAYS = 7;
export const MIN_SPAN_DAYS = 1;
export const MAX_SPAN_DAYS = 31;

export const STUDY_VIEW_INPUT_ERROR = "1〜31の整数で指定してください。";

/** 学習管理の表示期間。anchorDate が無いときは日曜始まり・7日 */
export type StudyViewSettings = {
  anchorDate?: string;
  spanDays: number;
};

export const DEFAULT_STUDY_VIEW: StudyViewSettings = {
  spanDays: DEFAULT_SPAN_DAYS,
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

export function normalizeStudyViewSettings(raw: unknown): StudyViewSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_STUDY_VIEW };
  const data = raw as { anchorDate?: unknown; spanDays?: unknown };
  const span = typeof data.spanDays === "number" ? data.spanDays : Number(data.spanDays);
  const anchor = typeof data.anchorDate === "string" ? data.anchorDate : "";
  if (!Number.isInteger(span) || span < MIN_SPAN_DAYS || span > MAX_SPAN_DAYS) {
    return { ...DEFAULT_STUDY_VIEW };
  }
  if (!isValidAnchorDate(anchor)) return { ...DEFAULT_STUDY_VIEW };
  return { anchorDate: anchor, spanDays: span };
}

/** 未設定、または日曜始まり・7日のとき、週の文言を使う */
export function usesWeekLabels(settings: StudyViewSettings): boolean {
  if (settings.spanDays !== DEFAULT_SPAN_DAYS) return false;
  if (!settings.anchorDate) return true;
  return parseStudyDate(settings.anchorDate).getDay() === 0;
}

/** 指定日を含む表示期間の開始日 */
export function getPeriodStart(date: Date, settings: StudyViewSettings): Date {
  if (!settings.anchorDate) return getWeekStart(date);
  const anchor = startOfDay(parseStudyDate(settings.anchorDate));
  const index = Math.floor(daysBetween(anchor, date) / settings.spanDays);
  return addDays(anchor, index * settings.spanDays);
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
  const spanText = spanDaysRaw.trim();
  if (!/^\d+$/.test(spanText)) return null;
  const spanDays = Number(spanText);
  if (!Number.isInteger(spanDays) || spanDays < MIN_SPAN_DAYS || spanDays > MAX_SPAN_DAYS) {
    return null;
  }
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
