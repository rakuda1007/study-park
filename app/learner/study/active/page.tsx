"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { updateStudyPlanMeta } from "@/lib/study/firestore";
import { studyActivePlanUsageLabel } from "@/lib/study/limits";
import {
  activePlanMarker,
  countActivePlanSummary,
  isStudyPlanCompleted,
  sortActiveSummaryPlans,
} from "@/lib/study/plan-order";
import { fetchAllStudyPlansCached, patchCachedStudyPlan } from "@/lib/study/plans-loader";
import { averageProgress } from "@/lib/study/progress";
import type { StudyPlanWithItems } from "@/lib/study/types";
import { learnerHomeHref, studyPlanHref } from "@/lib/study/urls";
import { formatDaysRemaining, formatPlanPeriodCompact } from "@/lib/study/week";

const COMPLETE_FAILED = "完了にできませんでした";

export default function LearnerStudyActivePage() {
  const [userId, setUserId] = useState("");
  const [plans, setPlans] = useState<StudyPlanWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const refresh = useCallback(async (uid: string) => {
    const data = await fetchAllStudyPlansCached(uid, { force: true });
    setPlans(data);
  }, []);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        setUserId(user.uid);
        try {
          await refresh(user.uid);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [refresh]);

  const activePlans = useMemo(
    () => sortActiveSummaryPlans(plans.filter((plan) => plan.status === "active")),
    [plans],
  );
  const counts = useMemo(() => countActivePlanSummary(activePlans), [activePlans]);
  const donePlans = activePlans.filter((plan) => isStudyPlanCompleted(plan));
  const restPlans = activePlans.filter((plan) => !isStudyPlanCompleted(plan));

  async function markCompleted(plan: StudyPlanWithItems) {
    if (!userId || savingId) return;
    const progress = averageProgress(plan.items);
    if (progress < 100 && !window.confirm(`進捗は${progress}%です。完了にしますか？`)) return;

    setSavingId(plan.id);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[plan.id];
      return next;
    });
    try {
      await updateStudyPlanMeta(userId, plan.id, { status: "completed" });
      const nextPlan: StudyPlanWithItems = { ...plan, status: "completed" };
      patchCachedStudyPlan(userId, nextPlan);
      setPlans((prev) => prev.map((item) => (item.id === plan.id ? nextPlan : item)));
    } catch {
      setErrors((prev) => ({ ...prev, [plan.id]: COMPLETE_FAILED }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <LearnerShell title="学習管理">
      <p className="study-back-link-wrap">
        <Link href={learnerHomeHref()} className="study-back-link">
          ← 学習管理に戻る
        </Link>
      </p>

      <h2 className="shell-page-heading">進行中のまとめ</h2>

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading ? (
        <>
          <p className="admin-msg">{studyActivePlanUsageLabel(activePlans.length)}</p>
          <ul className="study-active-summary__counts">
            <li>進捗100% {counts.done}件</li>
            <li>期限が近い {counts.urgent}件</li>
            <li>遅れ {counts.behind}件</li>
            <li>順調 {counts.ok}件</li>
          </ul>
        </>
      ) : null}

      {!loading && donePlans.length > 0 ? (
        <section className="study-active-summary__section">
          <h3 className="shell-page-heading">進捗100%・まだ進行中</h3>
          <p className="admin-msg admin-msg--subtle study-active-summary__note">
            完了にすると進行中の件数から外れます。
          </p>
          {donePlans.map((plan) => (
            <ActivePlanRow
              key={plan.id}
              plan={plan}
              saving={savingId !== null}
              error={errors[plan.id]}
              onComplete={() => void markCompleted(plan)}
            />
          ))}
        </section>
      ) : null}

      {!loading && restPlans.length > 0 ? (
        <section className="study-active-summary__section">
          <h3 className="shell-page-heading">そのほかの進行中</h3>
          {restPlans.map((plan) => (
            <ActivePlanRow
              key={plan.id}
              plan={plan}
              saving={savingId !== null}
              error={errors[plan.id]}
              onComplete={() => void markCompleted(plan)}
            />
          ))}
        </section>
      ) : null}

      {!loading && activePlans.length === 0 ? (
        <section className="admin-card">
          <p>進行中の計画はありません。</p>
        </section>
      ) : null}
    </LearnerShell>
  );
}

function ActivePlanRow({
  plan,
  saving,
  error,
  onComplete,
}: {
  plan: StudyPlanWithItems;
  saving: boolean;
  error?: string;
  onComplete: () => void;
}) {
  const progress = averageProgress(plan.items);
  const marker = activePlanMarker(plan);

  return (
    <article className="study-active-row">
      <div className="study-active-row__main">
        <Link href={studyPlanHref(plan.id)} className="study-active-row__subject">
          {plan.subjectName}
        </Link>
        <span>{formatPlanPeriodCompact(plan.startDate, plan.dueDate)}</span>
        <span>進捗 {progress}%</span>
        <span className={`study-status-badge study-status-badge--${marker.badge}`}>
          {marker.label}
        </span>
        <span>{formatDaysRemaining(plan.dueDate)}</span>
      </div>
      <button type="button" className="admin-btn" disabled={saving} onClick={onComplete}>
        完了にする
      </button>
      {error ? (
        <p className="admin-msg admin-msg--error study-active-row__error" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}
