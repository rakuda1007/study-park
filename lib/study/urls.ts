export function studyPlanHref(planId: string): string {
  return `/learner/study/plan?planId=${encodeURIComponent(planId)}`;
}

export function studyPlanEditHref(planId: string): string {
  return `/learner/study/plan?planId=${encodeURIComponent(planId)}&edit=1`;
}
