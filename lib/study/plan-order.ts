import { averageProgress } from "./progress";
import type { StudyPlanWithItems } from "./types";

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
