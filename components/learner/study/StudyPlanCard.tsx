"use client";

import Link from "next/link";
import { workspacePlayHref } from "@/lib/content/urls";
import {
  averageProgress,
  delayStatus,
  delayStatusLabel,
} from "@/lib/study/progress";
import type { StudyPlanWithItems } from "@/lib/study/types";
import { studyPlanHref } from "@/lib/study/urls";
import {
  formatDaysRemaining,
  formatPlanPeriodCompact,
} from "@/lib/study/week";
import { StudyReadableText } from "./StudyReadableText";
import { StudyProgressBar } from "./StudyProgressBar";
import { StudyProgressGauge } from "./StudyProgressGauge";

type Props = {
  plan: StudyPlanWithItems;
  compact?: boolean;
  /** 週ビュー一覧用：科目名を出さずコンパクト表示 */
  listView?: boolean;
  /** 科目見出し側でステータスを出すときはカード内を省略 */
  hideStatusBadge?: boolean;
};

export function StudyPlanCard({
  plan,
  compact = false,
  listView = false,
  hideStatusBadge = false,
}: Props) {
  const progress = averageProgress(plan.items);
  const completed = progress >= 100 || plan.status === "completed";
  const status = delayStatus(progress, plan.startDate, plan.dueDate);
  const statusLabel = completed ? null : delayStatusLabel(status);
  const daysLabel = formatDaysRemaining(plan.dueDate, new Date(), completed);
  const periodLabel = formatPlanPeriodCompact(plan.startDate, plan.dueDate);

  return (
    <article
      className={`study-plan-card${compact ? " study-plan-card--compact" : ""}${listView ? " study-plan-card--list" : ""}`}
    >
      <header
        className={`study-plan-card__header${listView ? " study-plan-card__header--list" : ""}`}
      >
        {listView ? (
          <p className="study-plan-card__meta-line">
            <span className="study-plan-card__period">{periodLabel}</span>
            <span className="study-plan-card__days">{daysLabel}</span>
            {statusLabel && !hideStatusBadge ? (
              <span className={`study-status-badge study-status-badge--${status}`}>
                {statusLabel}
              </span>
            ) : null}
          </p>
        ) : (
          <div>
            <h3 className="study-plan-card__subject">{plan.subjectName}</h3>
            <p className="study-plan-card__meta">
              {periodLabel}
              <span className="study-plan-card__days">{daysLabel}</span>
            </p>
          </div>
        )}
        <Link
          href={studyPlanHref(plan.id)}
          className={`study-plan-card__link${listView ? " study-plan-card__link--action" : ""}`}
        >
          {listView ? "記録する" : "詳細"}
        </Link>
      </header>

      <StudyProgressGauge
        percent={progress}
        status={status}
        size={listView || compact ? "sm" : "md"}
        hideBadge={listView}
      />

      {!compact && plan.items.length > 0 ? (
        <ul className={`study-plan-card__items${listView ? " study-plan-card__items--list" : ""}`}>
          {plan.items.map((item) => (
            <li
              key={item.id}
              className={`study-plan-card__item${listView ? " study-plan-card__item--list" : ""}`}
            >
              <div className="study-plan-card__item-head">
                <span className="study-plan-card__item-label">
                  {item.source === "app" ? (
                    <span className="study-plan-card__app-badge" title="Study Park 教材">
                      📱
                    </span>
                  ) : null}
                  <StudyReadableText text={item.label} />
                  {item.scopeNote ? (
                    <span className="study-plan-card__scope">
                      （<StudyReadableText text={item.scopeNote} />）
                    </span>
                  ) : null}
                </span>
                <span className="study-plan-card__item-actions">
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
                </span>
              </div>
              <StudyProgressBar
                percent={item.progressPercent}
                size="sm"
                hideBadge
              />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
