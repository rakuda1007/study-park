"use client";

import Link from "next/link";
import { workspacePlayHref } from "@/lib/content/urls";
import {
  averageProgress,
  delayStatus,
} from "@/lib/study/progress";
import type { StudyPlanWithItems } from "@/lib/study/types";
import { studyPlanHref } from "@/lib/study/urls";
import {
  formatDaysRemaining,
  formatStudyDate,
  parseStudyDate,
} from "@/lib/study/week";
import { StudyProgressBar } from "./StudyProgressBar";

type Props = {
  plan: StudyPlanWithItems;
  compact?: boolean;
};

export function StudyPlanCard({ plan, compact = false }: Props) {
  const progress = averageProgress(plan.items);
  const status = delayStatus(progress, plan.startDate, plan.dueDate);
  const daysLabel = formatDaysRemaining(plan.dueDate);
  const periodLabel = `${formatStudyDate(parseStudyDate(plan.startDate)).replace(/-/g, "/")}〜${formatStudyDate(parseStudyDate(plan.dueDate)).replace(/-/g, "/")}`;

  return (
    <article className={`study-plan-card${compact ? " study-plan-card--compact" : ""}`}>
      <header className="study-plan-card__header">
        <div>
          <h3 className="study-plan-card__subject">{plan.subjectName}</h3>
          <p className="study-plan-card__meta">
            {periodLabel}
            <span className="study-plan-card__days">{daysLabel}</span>
          </p>
        </div>
        <Link href={studyPlanHref(plan.id)} className="study-plan-card__link">
          詳細
        </Link>
      </header>

      <StudyProgressBar percent={progress} status={status} size={compact ? "sm" : "md"} />

      {!compact && plan.items.length > 0 ? (
        <ul className="study-plan-card__items">
          {plan.items.map((item) => (
            <li key={item.id} className="study-plan-card__item">
              <div className="study-plan-card__item-head">
                <span className="study-plan-card__item-label">
                  {item.source === "app" ? (
                    <span className="study-plan-card__app-badge" title="Study Park 教材">
                      📱
                    </span>
                  ) : null}
                  {item.label}
                  {item.scopeNote ? (
                    <span className="study-plan-card__scope">（{item.scopeNote}）</span>
                  ) : null}
                </span>
                {item.source === "app" && item.contentRef ? (
                  <Link
                    href={workspacePlayHref(
                      item.contentRef.workspaceSlug,
                      item.contentRef.contentSlug,
                      item.contentRef.workspaceId,
                      item.contentRef.contentId,
                    )}
                    className="study-plan-card__play-link"
                  >
                    学ぶ
                  </Link>
                ) : null}
              </div>
              <StudyProgressBar percent={item.progressPercent} size="sm" />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
