"use client";

import Link from "next/link";
import {
  isStudyActivePlanAtLimit,
  isStudyActivePlanNearLimit,
  studyActivePlanUsageLabel,
} from "@/lib/study/limits";

type Props = {
  activeCount: number;
  className?: string;
};

export function StudyActivePlanUsageBanner({ activeCount, className = "" }: Props) {
  const atLimit = isStudyActivePlanAtLimit(activeCount);
  const nearLimit = isStudyActivePlanNearLimit(activeCount);

  if (!nearLimit && !atLimit) return null;

  return (
    <section
      className={`admin-card study-limit-banner${atLimit ? " study-limit-banner--danger" : " study-limit-banner--warn"}${className ? ` ${className}` : ""}`}
      role="status"
    >
      <p className="study-limit-banner__title">
        {atLimit ? "進行中の学習計画が上限に達しています" : "進行中の学習計画が上限に近づいています"}
      </p>
      <p className="study-limit-banner__body">
        {studyActivePlanUsageLabel(activeCount)}。
        {atLimit
          ? " 新しい計画を追加するには、完了または削除してください。"
          : " 不要な計画は完了または削除しておくと安心です。"}
        {" "}
        完了した計画は1年経過後に自動アーカイブされます。
      </p>
      {atLimit ? (
        <p className="study-limit-banner__actions">
          <Link href="/learner/study/all" className="admin-btn">
            すべての計画を見る
          </Link>
        </p>
      ) : null}
    </section>
  );
}
