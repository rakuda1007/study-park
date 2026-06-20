"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StudyPlanCard } from "@/components/learner/study/StudyPlanCard";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { fetchAllStudyPlansCached } from "@/lib/study/plans-loader";
import { countActiveStudyPlans } from "@/lib/study/firestore";
import { isStudyActivePlanAtLimit, studyActivePlanUsageLabel } from "@/lib/study/limits";
import type { StudyPlanWithItems } from "@/lib/study/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { StudyActivePlanUsageBanner } from "@/components/learner/study/StudyActivePlanUsageBanner";

export default function LearnerStudyAllPage() {
  const [plans, setPlans] = useState<StudyPlanWithItems[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (uid: string) => {
    const [data, active] = await Promise.all([
      fetchAllStudyPlansCached(uid),
      countActiveStudyPlans(uid),
    ]);
    setPlans(data);
    setActiveCount(active);
  }, []);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        try {
          await refresh(user.uid);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [refresh]);

  const active = plans.filter((p) => p.status === "active");
  const completed = plans.filter((p) => p.status === "completed");

  return (
    <LearnerShell title="学習管理">
      <p className="study-back-link-wrap">
        <Link href="/learner/study" className="study-back-link">
          ← 週ビューに戻る
        </Link>
      </p>

      <p className="admin-msg">{studyActivePlanUsageLabel(activeCount)}</p>
      <StudyActivePlanUsageBanner activeCount={activeCount} />

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading && active.length > 0 ? (
        <section className="study-plan-list">
          <h2 className="shell-page-heading">進行中の計画</h2>
          {active.map((plan) => (
            <StudyPlanCard key={plan.id} plan={plan} />
          ))}
        </section>
      ) : null}

      {!loading && completed.length > 0 ? (
        <section className="study-plan-list">
          <h2 className="shell-page-heading">完了した計画</h2>
          <p className="admin-msg admin-msg--subtle">
            完了から1年経過した計画は、自動的にアーカイブされます。
          </p>
          {completed.map((plan) => (
            <StudyPlanCard key={plan.id} plan={plan} compact />
          ))}
        </section>
      ) : null}

      {!loading && plans.length === 0 ? (
        <section className="admin-card">
          <p>学習計画はまだありません。</p>
        </section>
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
      </div>
    </LearnerShell>
  );
}
