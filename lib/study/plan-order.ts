import { averageProgress, delayStatus } from "./progress";
import type { StudyPlanWithItems } from "./types";

export type ActivePlanSummaryKind = "done" | "urgent" | "behind" | "ok";

export type ActivePlanMarker = {
  kind: ActivePlanSummaryKind;
  label: string;
  badge: "done" | "urgent" | "warning" | "danger" | "ok";
};

/** 進行中まとめの目印。進捗100%は遅れ判定より優先する */
export function activePlanMarker(plan: StudyPlanWithItems, today = new Date()): ActivePlanMarker {
  const progress = averageProgress(plan.items);
  if (progress >= 100) return { kind: "done", label: "進捗100%", badge: "done" };
  const status = delayStatus(progress, plan.startDate, plan.dueDate, today);
  if (status === "urgent") return { kind: "urgent", label: "期限が近い", badge: "urgent" };
  if (status === "warning") return { kind: "behind", label: "やや遅れ", badge: "warning" };
  if (status === "danger") return { kind: "behind", label: "遅れ気味", badge: "danger" };
  return { kind: "ok", label: "順調", badge: "ok" };
}

export function countActivePlanSummary(plans: StudyPlanWithItems[], today = new Date()) {
  const counts: Record<ActivePlanSummaryKind, number> = {
    done: 0,
    urgent: 0,
    behind: 0,
    ok: 0,
  };
  for (const plan of plans) {
    counts[activePlanMarker(plan, today).kind] += 1;
  }
  return counts;
}

/** 進捗100%の進行中を先に、それぞれの中では期限が早い順 */
export function compareActiveSummaryPlans(a: StudyPlanWithItems, b: StudyPlanWithItems): number {
  const aDone = averageProgress(a.items) >= 100;
  const bDone = averageProgress(b.items) >= 100;
  if (aDone !== bDone) return aDone ? -1 : 1;
  const byDue = a.dueDate.localeCompare(b.dueDate);
  if (byDue !== 0) return byDue;
  const bySubject = a.subjectName.localeCompare(b.subjectName, "ja");
  if (bySubject !== 0) return bySubject;
  return a.id.localeCompare(b.id);
}

export function sortActiveSummaryPlans(plans: StudyPlanWithItems[]): StudyPlanWithItems[] {
  return [...plans].sort(compareActiveSummaryPlans);
}

/** 進捗100%または完了状態の計画 */
export function isStudyPlanCompleted(plan: StudyPlanWithItems): boolean {
  return plan.status === "completed" || averageProgress(plan.items) >= 100;
}

/**
 * 未完了を先に、それぞれの中では期限が早い順。
 * 期限が同じときは科目名、それも同じときは id で安定させる。
 */
export function compareStudyPlans(a: StudyPlanWithItems, b: StudyPlanWithItems): number {
  const aDone = isStudyPlanCompleted(a);
  const bDone = isStudyPlanCompleted(b);
  if (aDone !== bDone) return aDone ? 1 : -1;
  const byDue = a.dueDate.localeCompare(b.dueDate);
  if (byDue !== 0) return byDue;
  const bySubject = a.subjectName.localeCompare(b.subjectName, "ja");
  if (bySubject !== 0) return bySubject;
  return a.id.localeCompare(b.id);
}

export function sortStudyPlans(plans: StudyPlanWithItems[]): StudyPlanWithItems[] {
  return [...plans].sort(compareStudyPlans);
}
