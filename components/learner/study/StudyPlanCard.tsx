"use client";

import Link from "next/link";
import { useState } from "react";
import { workspacePlayHref } from "@/lib/content/urls";
import { updateStudyItemProgress } from "@/lib/study/firestore";
import { patchCachedStudyPlan } from "@/lib/study/plans-cache";
import {
  averageProgress,
  delayStatus,
  delayStatusLabel,
} from "@/lib/study/progress";
import type { StudyPlanWithItems } from "@/lib/study/types";
import { studyPlanEditHref, studyPlanHref } from "@/lib/study/urls";
import {
  formatDaysRemaining,
  formatPlanPeriodCompact,
} from "@/lib/study/week";
import { StudyReadableText } from "./StudyReadableText";
import { StudyProgressBar } from "./StudyProgressBar";
import { StudyProgressGauge } from "./StudyProgressGauge";

const PROGRESS_BUMP = 10;

type Props = {
  plan: StudyPlanWithItems;
  userId?: string;
  /** ＋10% 保存後に、親の一覧状態を更新する */
  onPlanChange?: (plan: StudyPlanWithItems) => void;
  compact?: boolean;
  /** 週ビュー一覧用：科目名を出さずコンパクト表示 */
  listView?: boolean;
  /** 科目見出し側でステータスを出すときはカード内を省略 */
  hideStatusBadge?: boolean;
};

export function StudyPlanCard({
  plan,
  userId = "",
  onPlanChange,
  compact = false,
  listView = false,
  hideStatusBadge = false,
}: Props) {
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [bumpErr, setBumpErr] = useState("");
  const progress = averageProgress(plan.items);
  const completed = progress >= 100 || plan.status === "completed";
  const status = delayStatus(progress, plan.startDate, plan.dueDate);
  const statusLabel = completed ? null : delayStatusLabel(status);
  const daysLabel = formatDaysRemaining(plan.dueDate, new Date(), completed);
  const periodLabel = formatPlanPeriodCompact(plan.startDate, plan.dueDate);

  async function bumpItem(itemId: string, currentPercent: number) {
    if (!userId || savingItemId) return;
    const nextPercent = Math.min(100, Math.max(0, Math.round(currentPercent)) + PROGRESS_BUMP);
    if (nextPercent === currentPercent) return;

    const nextPlan: StudyPlanWithItems = {
      ...plan,
      items: plan.items.map((item) =>
        item.id === itemId ? { ...item, progressPercent: nextPercent } : item,
      ),
    };
    setBumpErr("");
    setSavingItemId(itemId);
    onPlanChange?.(nextPlan);
    patchCachedStudyPlan(userId, nextPlan);
    try {
      await updateStudyItemProgress(userId, plan.id, itemId, nextPercent);
    } catch (e) {
      onPlanChange?.(plan);
      patchCachedStudyPlan(userId, plan);
      setBumpErr(e instanceof Error ? e.message : "進捗を保存できませんでした。");
    } finally {
      setSavingItemId(null);
    }
  }

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
      </header>

      {listView ? (
        <div className="study-plan-card__toolbar">
          <Link href={studyPlanEditHref(plan.id)} className="study-plan-card__link">
            編集する
          </Link>
          <Link
            href={studyPlanHref(plan.id)}
            className="study-plan-card__link study-plan-card__link--action"
          >
            記録する
          </Link>
        </div>
      ) : (
        <div className="study-plan-card__toolbar study-plan-card__toolbar--detail">
          <Link href={studyPlanEditHref(plan.id)} className="study-plan-card__link">
            編集する
          </Link>
          <Link
            href={studyPlanHref(plan.id)}
            className="study-plan-card__link study-plan-card__link--action"
          >
            記録する
          </Link>
        </div>
      )}

      <StudyProgressGauge
        percent={progress}
        status={status}
        size={compact && !listView ? "sm" : "md"}
        hideBadge={listView}
      />

      {!compact && plan.items.length > 0 ? (
        <>
        <ul className={`study-plan-card__items${listView ? " study-plan-card__items--list" : ""}`}>
          {plan.items.map((item) => (
            <li
              key={item.id}
              className={`study-plan-card__item${listView ? " study-plan-card__item--list" : ""}`}
            >
              <div className="study-plan-card__item-head">
                <span className="study-plan-card__item-label">
                  {item.source === "app" ? (
                    <span className="study-plan-card__app-badge" title="アプリの教材">
                      アプリ
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
              <div className="study-plan-card__item-progress">
                <StudyProgressBar
                  percent={item.progressPercent}
                  size="sm"
                  hideBadge
                />
                {userId ? (
                  <button
                    type="button"
                    className="study-plan-card__bump"
                    disabled={savingItemId !== null || item.progressPercent >= 100}
                    aria-label={`${item.label}を10%進める`}
                    onClick={() => void bumpItem(item.id, item.progressPercent)}
                  >
                    ＋10%
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {bumpErr ? <p className="admin-msg admin-msg--error">{bumpErr}</p> : null}
        </>
      ) : null}
    </article>
  );
}
