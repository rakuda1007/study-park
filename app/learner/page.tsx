"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { StudyPlanCard } from "@/components/learner/study/StudyPlanCard";
import { StudyProgressBar } from "@/components/learner/study/StudyProgressBar";
import { StudyWeekNav } from "@/components/learner/study/StudyWeekNav";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { fetchWeekStudyPlansCached } from "@/lib/study/plans-loader";
import { countActiveStudyPlans } from "@/lib/study/firestore";
import {
  isStudyActivePlanAtLimit,
  studyActivePlanUsageLabel,
} from "@/lib/study/limits";
import {
  averageProgress,
  delayStatus,
  delayStatusLabel,
} from "@/lib/study/progress";
import { sortStudyPlans } from "@/lib/study/plan-order";
import type { StudyPlanWithItems } from "@/lib/study/types";
import {
  DEFAULT_STUDY_VIEW,
  getPeriodEnd,
  getPeriodStart,
  isFactoryDefault,
  usesWeekLabels,
  type StudyViewSettings,
} from "@/lib/study/view-period";
import { studyActiveSummaryHref } from "@/lib/study/urls";
import { loadStudyViewSettings, saveStudyViewSettings } from "@/lib/study/view-settings";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { StudyActivePlanUsageBanner } from "@/components/learner/study/StudyActivePlanUsageBanner";

/** 並び順を保ったまま、隣り合う同じ科目だけ見出しを共有する */
function groupConsecutiveBySubject(
  plans: StudyPlanWithItems[],
): { key: string; subjectName: string; plans: StudyPlanWithItems[] }[] {
  const groups: { key: string; subjectName: string; plans: StudyPlanWithItems[] }[] = [];
  for (const plan of plans) {
    const last = groups[groups.length - 1];
    if (last && last.subjectName === plan.subjectName) {
      last.plans.push(plan);
      continue;
    }
    groups.push({ key: plan.id, subjectName: plan.subjectName, plans: [plan] });
  }
  return groups;
}

function LearnerHomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [plans, setPlans] = useState<StudyPlanWithItems[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewSettings, setViewSettings] = useState<StudyViewSettings>(DEFAULT_STUDY_VIEW);
  const [viewReady, setViewReady] = useState(false);
  const [viewLoadFailed, setViewLoadFailed] = useState(false);
  const [periodStart, setPeriodStart] = useState(() =>
    getPeriodStart(new Date(), DEFAULT_STUDY_VIEW),
  );
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);
  const periodEnd = useMemo(
    () => getPeriodEnd(periodStart, viewSettings.spanDays),
    [periodStart, viewSettings.spanDays],
  );
  const weekLabels = usesWeekLabels(viewSettings);

  useEffect(() => {
    const created = searchParams.get("created");
    if (!created) return;
    setCreatedNotice(created);
    router.replace("/learner", { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setUserId(user?.uid ?? "");
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!userId) {
      setViewReady(false);
      return;
    }
    let cancelled = false;
    setViewReady(false);
    setViewLoadFailed(false);
    void (async () => {
      try {
        const next = await loadStudyViewSettings(userId);
        if (cancelled) return;
        setViewSettings(next);
        if (!isFactoryDefault(next)) {
          setPeriodStart(getPeriodStart(new Date(), next));
        }
      } catch {
        if (cancelled) return;
        setViewSettings(DEFAULT_STUDY_VIEW);
        setPeriodStart(getPeriodStart(new Date(), DEFAULT_STUDY_VIEW));
        setViewLoadFailed(true);
      } finally {
        if (!cancelled) setViewReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !viewReady) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const [data, active] = await Promise.all([
          fetchWeekStudyPlansCached(userId, periodStart, periodEnd),
          countActiveStudyPlans(userId),
        ]);
        if (!cancelled) {
          setPlans(data);
          setActiveCount(active);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, viewReady, periodStart, periodEnd]);

  async function handleSaveView(input: { anchorDate: string; spanDays: number }) {
    if (!userId) throw new Error("ログインが必要です。");
    const next: StudyViewSettings = {
      ...viewSettings,
      anchorDate: input.anchorDate,
      spanDays: input.spanDays,
    };
    await saveStudyViewSettings(userId, next);
    setViewSettings(next);
    setPeriodStart(getPeriodStart(new Date(), next));
  }

  async function handleSaveStandard(input: { weekday: number; spanDays: number }) {
    if (!userId) throw new Error("ログインが必要です。");
    const next: StudyViewSettings = {
      spanDays: input.spanDays,
      standardWeekday: input.weekday,
      standardSpanDays: input.spanDays,
    };
    await saveStudyViewSettings(userId, next);
    setViewSettings(next);
    setPeriodStart(getPeriodStart(new Date(), next));
  }

  async function handleResetView() {
    if (!userId) throw new Error("ログインが必要です。");
    const next: StudyViewSettings = {
      spanDays: viewSettings.standardSpanDays,
      standardWeekday: viewSettings.standardWeekday,
      standardSpanDays: viewSettings.standardSpanDays,
    };
    await saveStudyViewSettings(userId, next);
    setViewSettings(next);
    setPeriodStart(getPeriodStart(new Date(), next));
  }

  const weekPlans = useMemo(() => plans, [plans]);

  const overallProgress = useMemo(() => {
    if (weekPlans.length === 0) return 0;
    const values = weekPlans.map((plan) => averageProgress(plan.items));
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [weekPlans]);

  const alertCounts = useMemo(() => {
    let nearDue = 0;
    let behind = 0;
    let completed = 0;
    for (const plan of weekPlans) {
      const progress = averageProgress(plan.items);
      const status = delayStatus(progress, plan.startDate, plan.dueDate);
      if (progress >= 100) {
        completed += 1;
        continue;
      }
      if (status === "urgent") {
        nearDue += 1;
      } else if (status === "warning" || status === "danger") {
        behind += 1;
      }
    }
    return { nearDue, behind, completed };
  }, [weekPlans]);

  const grouped = useMemo(
    () => groupConsecutiveBySubject(sortStudyPlans(weekPlans)),
    [weekPlans],
  );

  return (
    <LearnerShell title="学習管理">
      {createdNotice ? (
        <p className="admin-msg admin-msg--ok" role="status">
          「{createdNotice}」の学習計画を追加しました。進んだ分は各項目の「＋10%」、細かい調整は「記録する」からできます。
        </p>
      ) : null}

      <p className="admin-msg learner-welcome-msg">
        自分やお子様の学習をかんたんに管理できます。表示中の期間の学習計画を確認できます。いつまでに何をやるか、どこまで進んだかを確認しましょう。
        {userId ? (
          <>
            {" "}
            （
            <Link href={studyActiveSummaryHref()} className="study-active-count-link">
              {studyActivePlanUsageLabel(activeCount)}
            </Link>
            ）
          </>
        ) : null}
      </p>

      <StudyActivePlanUsageBanner activeCount={activeCount} />

      <StudyWeekNav
        periodStart={periodStart}
        settings={viewSettings}
        editable={Boolean(userId) && viewReady && !viewLoadFailed}
        onChange={setPeriodStart}
        onSave={handleSaveView}
        onSaveStandard={handleSaveStandard}
        onReset={handleResetView}
      />

      {viewLoadFailed ? (
        <p className="admin-msg admin-msg--error" role="alert">
          期間設定を読み込めませんでした。表示は日曜始まりの7日間です。
        </p>
      ) : null}

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading && weekPlans.length > 0 ? (
        <section className="admin-card study-summary-card study-summary-card--compact">
          <div className="study-summary-card__row study-summary-card__row--bar">
            <span className="study-summary-card__title">
              {weekLabels ? "今週の進捗" : "この期間の進捗"}（{weekPlans.length}件）
            </span>
            <div className="study-summary-card__bar-wrap">
              <StudyProgressBar percent={overallProgress} size="sm" hideBadge />
            </div>
          </div>
          {(alertCounts.completed > 0 ||
            alertCounts.behind > 0 ||
            alertCounts.nearDue > 0) && (
            <p className="study-summary-card__meta">
              {alertCounts.completed > 0 ? (
                <span className="study-summary-card__done">
                  完了 {alertCounts.completed}件
                </span>
              ) : null}
              {alertCounts.completed > 0 &&
              (alertCounts.behind > 0 || alertCounts.nearDue > 0)
                ? " · "
                : null}
              {alertCounts.behind > 0 ? (
                <span className="study-summary-card__alert">
                  遅れ {alertCounts.behind}件
                </span>
              ) : null}
              {alertCounts.behind > 0 && alertCounts.nearDue > 0 ? " · " : null}
              {alertCounts.nearDue > 0 ? (
                <span className="study-summary-card__urgent">
                  期限近 {alertCounts.nearDue}件
                </span>
              ) : null}
            </p>
          )}
        </section>
      ) : null}

      {!loading && weekPlans.length === 0 ? (
        <section className="admin-card">
          <p>
            この期間に表示できる学習計画がありません。別の期間を選ぶか、下のボタンから追加してください。
          </p>
        </section>
      ) : null}

      {!loading && weekPlans.length > 0 ? (
        <div className="study-plan-list study-week-page__plans">
          {grouped.map(({ key, subjectName, plans: subjectPlans }) => {
            const singlePlan = subjectPlans.length === 1 ? subjectPlans[0] : null;
            const singleProgress = singlePlan ? averageProgress(singlePlan.items) : 0;
            const singleCompleted =
              singlePlan &&
              (singleProgress >= 100 || singlePlan.status === "completed");
            const singleStatus =
              singlePlan && !singleCompleted
                ? delayStatus(
                    singleProgress,
                    singlePlan.startDate,
                    singlePlan.dueDate,
                  )
                : null;
            const singleBadge =
              singleStatus && singlePlan ? delayStatusLabel(singleStatus) : null;

            return (
              <section key={key} className="study-subject-section">
                <div className="study-subject-section__head">
                  <h2 className="study-subject-section__title">{subjectName}</h2>
                  {singleBadge ? (
                    <span
                      className={`study-status-badge study-status-badge--${singleStatus}`}
                    >
                      {singleBadge}
                    </span>
                  ) : null}
                </div>
                {subjectPlans.map((plan) => (
                  <StudyPlanCard
                    key={plan.id}
                    plan={plan}
                    userId={userId}
                    onPlanChange={(next) =>
                      setPlans((prev) => prev.map((p) => (p.id === next.id ? next : p)))
                    }
                    listView
                    hideStatusBadge={subjectPlans.length === 1}
                  />
                ))}
              </section>
            );
          })}
        </div>
      ) : null}

      <div className="study-page-actions">
        {isStudyActivePlanAtLimit(activeCount) ? (
          <span className="admin-btn admin-btn--primary admin-btn--disabled" aria-disabled="true">
            ＋ 学習計画を追加（上限）
          </span>
        ) : (
          <Link href="/learner/study/new" className="admin-btn admin-btn--primary">
            ＋ 学習計画を追加
          </Link>
        )}
        {userId ? (
          <Link href="/learner/study/all" className="admin-btn">
            すべての計画を見る
          </Link>
        ) : null}
      </div>
    </LearnerShell>
  );
}

export default function LearnerHomePage() {
  return (
    <Suspense
      fallback={
        <LearnerShell title="学習管理">
          <p className="admin-loading">読み込み中…</p>
        </LearnerShell>
      }
    >
      <LearnerHomeInner />
    </Suspense>
  );
}
