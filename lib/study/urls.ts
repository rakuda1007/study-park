export function studyPlanHref(planId: string): string {
  return `/learner/study/plan?planId=${encodeURIComponent(planId)}`;
}

export function studyPlanEditHref(planId: string): string {
  return `/learner/study/plan?planId=${encodeURIComponent(planId)}&edit=1`;
}

/** 学習管理トップ。作成完了時は created に科目名を渡す */
export function learnerHomeHref(opts?: { createdSubject?: string }): string {
  if (opts?.createdSubject) {
    return `/learner?created=${encodeURIComponent(opts.createdSubject)}`;
  }
  return "/learner";
}
