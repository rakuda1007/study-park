/** アクティブな学習計画のソフト上限（件） */
export const STUDY_ACTIVE_PLAN_LIMIT = 50;

/** 上限接近の警告を出すしきい値（件） */
export const STUDY_ACTIVE_PLAN_WARN_THRESHOLD = 45;

/** 完了計画を自動アーカイブするまでの日数 */
export const STUDY_COMPLETED_ARCHIVE_AFTER_DAYS = 365;

export class StudyPlanLimitError extends Error {
  readonly code = "STUDY_ACTIVE_PLAN_LIMIT" as const;

  constructor(
    activeCount: number,
    limit = STUDY_ACTIVE_PLAN_LIMIT,
  ) {
    super(
      `進行中の学習計画が上限（${limit}件）に達しています（現在 ${activeCount}件）。` +
        "完了または削除してから追加してください。",
    );
    this.name = "StudyPlanLimitError";
  }
}

export function isStudyPlanLimitError(error: unknown): error is StudyPlanLimitError {
  return error instanceof StudyPlanLimitError;
}

export function studyActivePlanUsageLabel(activeCount: number): string {
  return `進行中 ${activeCount} / ${STUDY_ACTIVE_PLAN_LIMIT} 件`;
}

export function isStudyActivePlanNearLimit(activeCount: number): boolean {
  return activeCount >= STUDY_ACTIVE_PLAN_WARN_THRESHOLD;
}

export function isStudyActivePlanAtLimit(activeCount: number): boolean {
  return activeCount >= STUDY_ACTIVE_PLAN_LIMIT;
}
