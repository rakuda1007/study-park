"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StudyPlanCard } from "@/components/learner/study/StudyPlanCard";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { fetchAllStudyPlansCached } from "@/lib/study/plans-loader";
import type { StudyPlanWithItems } from "@/lib/study/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";

export default function LearnerStudyAllPage() {
  const [plans, setPlans] = useState<StudyPlanWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (uid: string) => {
    const data = await fetchAllStudyPlansCached(uid);
    setPlans(data);
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
        <Link href="/learner/study/new" className="admin-btn admin-btn--primary">
          ＋ 学習計画を追加
        </Link>
      </div>
    </LearnerShell>
  );
}
