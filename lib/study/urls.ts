export function studyPlanHref(planId: string): string {
  return `/learner/study/plan?planId=${encodeURIComponent(planId)}`;
}
