"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StudyPlanCard } from "@/components/learner/study/StudyPlanCard";
import { StudyProgressBar } from "@/components/learner/study/StudyProgressBar";
import { StudyWeekNav } from "@/components/learner/study/StudyWeekNav";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { listStudyPlansWithItems } from "@/lib/study/firestore";
import {
  averageProgress,
  delayStatus,
  delayStatusLabel,
} from "@/lib/study/progress";
import type { StudyPlanWithItems } from "@/lib/study/types";
import {
  daysRemaining,
  getWeekEnd,
  getWeekStart,
  planOverlapsWeek,
} from "@/lib/study/week";
import { subscribeAuth } from "@/lib/firebase/auth-client";

function groupPlansBySubject(plans: StudyPlanWithItems[]): Map<string, StudyPlanWithItems[]> {
  const map = new Map<string, StudyPlanWithItems[]>();
  for (const plan of plans) {
    const key = plan.subjectName;
    const list = map.get(key) ?? [];
    list.push(plan);
    map.set(key, list);
  }
  return map;
}

export default function LearnerStudyPage() {
  const [userId, setUserId] = useState("");
  const [plans, setPlans] = useState<StudyPlanWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const refresh = useCallback(async (uid: string) => {
    const data = await listStudyPlansWithItems(uid);
    setPlans(data.filter((p) => p.status !== "archived"));
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

  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  const weekPlans = useMemo(
    () =>
      plans.filter((plan) =>
        planOverlapsWeek(plan, weekStart, weekEnd),
      ),
    [plans, weekStart, weekEnd],
  );

  const overallProgress = useMemo(() => {
    if (weekPlans.length === 0) return 0;
    const values = weekPlans.map((plan) => averageProgress(plan.items));
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [weekPlans]);

  const alertCounts = useMemo(() => {
    let nearDue = 0;
    let behind = 0;
    for (const plan of weekPlans) {
      const progress = averageProgress(plan.items);
      const status = delayStatus(progress, plan.startDate, plan.dueDate);
      if (daysRemaining(plan.dueDate) <= 3 && progress < 100) {
        nearDue += 1;
      }
      if (status === "warning" || status === "danger" || status === "urgent") {
        behind += 1;
      }
    }
    return { nearDue, behind };
  }, [weekPlans]);

  const grouped = useMemo(() => groupPlansBySubject(weekPlans), [weekPlans]);

  return (
    <LearnerShell title="学習管理">
      <p className="admin-msg learner-welcome-msg">
        いつまでに何をやるか、どこまで進んだかを週単位で確認できます。
      </p>

      <StudyWeekNav weekStart={weekStart} onChange={setWeekStart} />

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading && weekPlans.length > 0 ? (
        <section className="admin-card study-summary-card">
          <h2 className="study-summary-card__title">今週の全体進捗</h2>
          <StudyProgressBar percent={overallProgress} />
          <p className="study-summary-card__meta">
            表示中の計画: {weekPlans.length}件
            {alertCounts.behind > 0 ? (
              <span className="study-summary-card__alert">
                ／ 遅れ気味: {alertCounts.behind}件
              </span>
            ) : null}
            {alertCounts.nearDue > 0 ? (
              <span className="study-summary-card__urgent">
                ／ 期限が近い: {alertCounts.nearDue}件
              </span>
            ) : null}
          </p>
        </section>
      ) : null}

      {!loading && weekPlans.length === 0 ? (
        <section className="admin-card">
          <p>
            {plans.length === 0
              ? "まだ学習計画がありません。下のボタンから追加してください。"
              : "この週に該当する学習計画はありません。別の週を選ぶか、新しい計画を追加してください。"}
          </p>
        </section>
      ) : null}

      {!loading && weekPlans.length > 0 ? (
        <div className="study-plan-list">
          {[...grouped.entries()].map(([subjectName, subjectPlans]) => (
            <section key={subjectName} className="study-subject-section">
              <h2 className="study-subject-section__title">{subjectName}</h2>
              {subjectPlans.map((plan) => {
                const progress = averageProgress(plan.items);
                const status = delayStatus(progress, plan.startDate, plan.dueDate);
                const badge = delayStatusLabel(status);
                return (
                  <div key={plan.id} className="study-subject-section__plan-wrap">
                    {badge ? (
                      <span className={`study-subject-section__status study-subject-section__status--${status}`}>
                        {badge}
                      </span>
                    ) : null}
                    <StudyPlanCard plan={plan} />
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      ) : null}

      <div className="study-page-actions">
        <Link href="/learner/study/new" className="admin-btn admin-btn--primary">
          ＋ 学習計画を追加
        </Link>
        {userId && plans.length > 0 ? (
          <Link href="/learner/study/all" className="admin-btn">
            すべての計画を見る
          </Link>
        ) : null}
      </div>
    </LearnerShell>
  );
}
