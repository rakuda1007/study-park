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
    let completed = 0;
    for (const plan of weekPlans) {
      const progress = averageProgress(plan.items);
      const status = delayStatus(progress, plan.startDate, plan.dueDate);
      if (progress >= 100) {
        completed += 1;
        continue;
      }
      if (daysRemaining(plan.dueDate) <= 3) {
        nearDue += 1;
      }
      if (status === "warning" || status === "danger" || status === "urgent") {
        behind += 1;
      }
    }
    return { nearDue, behind, completed };
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
        <section className="admin-card study-summary-card study-summary-card--compact">
          <div className="study-summary-card__row study-summary-card__row--bar">
            <span className="study-summary-card__title">
              今週の進捗（{weekPlans.length}件）
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
            {plans.length === 0
              ? "まだ学習計画がありません。下のボタンから追加してください。"
              : "この週に該当する学習計画はありません。別の週を選ぶか、新しい計画を追加してください。"}
          </p>
        </section>
      ) : null}

      {!loading && weekPlans.length > 0 ? (
        <div className="study-plan-list study-week-page__plans">
          {[...grouped.entries()].map(([subjectName, subjectPlans]) => {
            const singlePlan = subjectPlans.length === 1 ? subjectPlans[0] : null;
            const singleStatus = singlePlan
              ? delayStatus(
                  averageProgress(singlePlan.items),
                  singlePlan.startDate,
                  singlePlan.dueDate,
                )
              : null;
            const singleBadge =
              singleStatus && singlePlan ? delayStatusLabel(singleStatus) : null;

            return (
              <section key={subjectName} className="study-subject-section">
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
        <Link href="/learner/study/new" className="admin-btn admin-btn--primary">
          ＋ 学習計画を追加
        </Link>
        {userId && plans.length > 0 ? (
          <Link href="/learner/study/all" className="admin-btn">
            すべての計画を見る
          </Link>
        ) : null}
        <Link href="/learner/study/templates" className="admin-btn">
          テンプレート
        </Link>
        <Link href="/learner/study/masters" className="admin-btn">
          よく使う項目
        </Link>
      </div>
    </LearnerShell>
  );
}
