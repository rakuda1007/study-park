import { daysRemaining, parseStudyDate } from "./week";
import type { StudyItemDoc } from "./types";

export type StudyDelayStatus = "ok" | "warning" | "danger" | "urgent";

export function averageProgress(items: Pick<StudyItemDoc, "progressPercent">[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + clampPercent(item.progressPercent), 0);
  return Math.round(sum / items.length);
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function expectedProgress(
  startDate: string,
  dueDate: string,
  today = new Date(),
): number {
  const start = parseStudyDate(startDate);
  const due = parseStudyDate(dueDate);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  due.setHours(23, 59, 59, 999);

  const total = due.getTime() - start.getTime();
  if (total <= 0) return 100;

  const elapsed = t.getTime() - start.getTime();
  if (elapsed <= 0) return 0;
  if (elapsed >= total) return 100;

  return Math.round((elapsed / total) * 100);
}

export function delayStatus(
  actualPercent: number,
  startDate: string,
  dueDate: string,
  today = new Date(),
): StudyDelayStatus {
  const actual = clampPercent(actualPercent);
  const expected = expectedProgress(startDate, dueDate, today);
  const daysLeft = daysRemaining(dueDate, today);

  if (daysLeft < 0 && actual < 100) return "danger";
  if (daysLeft <= 3 && actual < 80) return "urgent";
  const diff = expected - actual;
  if (diff > 25) return "danger";
  if (diff > 10) return "warning";
  return "ok";
}

export function delayStatusLabel(status: StudyDelayStatus): string | null {
  switch (status) {
    case "urgent":
      return "期限が近い";
    case "danger":
      return "遅れ気味";
    case "warning":
      return "やや遅れ";
    default:
      return null;
  }
}
