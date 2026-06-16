/** 日付文字列 (YYYY-MM-DD) をローカル日付として解釈 */
export function parseStudyDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatStudyDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayStudyDate(): string {
  return formatStudyDate(new Date());
}

/** 日曜始まり・土曜終わりの週の開始日（日曜） */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addWeeks(weekStart: Date, weeks: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export function formatWeekLabel(weekStart: Date): string {
  return formatWeekLabelCompact(weekStart);
}

/** 週表示用の短いラベル（例: 6/14〜20） */
export function formatWeekLabelCompact(weekStart: Date, today = new Date()): string {
  const weekEnd = getWeekEnd(weekStart);
  const range = formatDateRangeCompact(weekStart, weekEnd);
  const y = weekStart.getFullYear();
  if (y !== today.getFullYear()) return `${y}/${range}`;
  return range;
}

/** 計画期間の短い表記（例: 6/12〜18） */
export function formatPlanPeriodCompact(startDate: string, dueDate: string): string {
  return formatDateRangeCompact(parseStudyDate(startDate), parseStudyDate(dueDate));
}

function formatDateRangeCompact(start: Date, end: Date): string {
  const sm = start.getMonth() + 1;
  const sd = start.getDate();
  const em = end.getMonth() + 1;
  const ed = end.getDate();
  if (sm === em) return `${sm}/${sd}〜${ed}`;
  return `${sm}/${sd}〜${em}/${ed}`;
}

export function planOverlapsWeek(
  plan: { startDate: string; dueDate: string; status: string },
  weekStart: Date,
  weekEnd: Date,
): boolean {
  if (plan.status === "archived") return false;
  const start = parseStudyDate(plan.startDate);
  const due = parseStudyDate(plan.dueDate);
  due.setHours(23, 59, 59, 999);
  return start <= weekEnd && due >= weekStart;
}

export function daysRemaining(dueDate: string, today = new Date()): number {
  const due = parseStudyDate(dueDate);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - t.getTime()) / (24 * 60 * 60 * 1000));
}

export function formatDaysRemaining(dueDate: string, today = new Date()): string {
  const days = daysRemaining(dueDate, today);
  if (days < 0) return `超過${Math.abs(days)}日`;
  if (days === 0) return "今日まで";
  return `残${days}日`;
}
