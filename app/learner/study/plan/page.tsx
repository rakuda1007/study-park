"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { StudyItemProgressEditor } from "@/components/learner/study/StudyItemProgressEditor";
import { StudyPlanForm } from "@/components/learner/study/StudyPlanForm";
import { StudyProgressBar } from "@/components/learner/study/StudyProgressBar";
import { StudySaveTemplateForm } from "@/components/learner/study/StudySaveTemplateForm";
import { LearnerShell } from "@/components/learner/LearnerShell";
import {
  customSubjectOption,
  isCustomSubjectId,
  loadStudySubjectData,
  type StudySubjectData,
} from "@/lib/study/subject-options";
import {
  deleteStudyPlan,
  getStudyPlanWithItems,
  replaceStudyItems,
  updateStudyPlanMeta,
} from "@/lib/study/firestore";
import { listStudyItemMasters } from "@/lib/study/masters-firestore";
import {
  averageProgress,
  delayStatus,
} from "@/lib/study/progress";
import type { StudyPlanInput, StudyPlanWithItems, StudyItemMasterDoc } from "@/lib/study/types";
import { formatDaysRemaining } from "@/lib/study/week";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import contentManifest from "@/public/content-manifest.json";
import type { ContentManifest } from "@/lib/content/types";

function LearnerStudyPlanInner() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const router = useRouter();
  const manifest = contentManifest as ContentManifest;

  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState<StudyPlanWithItems | null>(null);
  const [subjectData, setSubjectData] = useState<StudySubjectData | null>(null);
  const [masters, setMasters] = useState<StudyItemMasterDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(
    async (uid: string) => {
      if (!planId) {
        setPlan(null);
        return;
      }
      const [data, subjects, masterList] = await Promise.all([
        getStudyPlanWithItems(uid, planId),
        loadStudySubjectData(uid, manifest),
        listStudyItemMasters(uid),
      ]);
      setPlan(data);
      setSubjectData(subjects);
      setMasters(masterList);
    },
    [planId, manifest],
  );

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

  const progress = useMemo(
    () => (plan ? averageProgress(plan.items) : 0),
    [plan],
  );

  const status = useMemo(
    () => (plan ? delayStatus(progress, plan.startDate, plan.dueDate) : "ok"),
    [plan, progress],
  );

  const initialInput = useMemo((): StudyPlanInput | undefined => {
    if (!plan) return undefined;
    const subjectId = plan.subjectId.startsWith("custom:")
      ? customSubjectOption().id
      : plan.subjectId;
    return {
      subjectId,
      subjectName: plan.subjectName,
      startDate: plan.startDate,
      dueDate: plan.dueDate,
      memo: plan.memo,
      items: plan.items.map((item) => ({
        source: item.source,
        label: item.label,
        scopeNote: item.scopeNote ?? "",
        contentRef: item.contentRef,
      })),
    };
  }, [plan]);

  async function handleDelete() {
    if (!userId || !plan) return;
    if (!window.confirm("この学習計画を削除しますか？")) return;
    setDeleting(true);
    try {
      await deleteStudyPlan(userId, plan.id);
      router.push("/learner/study");
    } finally {
      setDeleting(false);
    }
  }

  async function markCompleted() {
    if (!userId || !plan) return;
    await updateStudyPlanMeta(userId, plan.id, { status: "completed" });
    await refresh(userId);
  }

  async function markActive() {
    if (!userId || !plan) return;
    await updateStudyPlanMeta(userId, plan.id, { status: "active" });
    await refresh(userId);
  }

  if (!planId) {
    return (
      <LearnerShell title="学習管理">
        <section className="admin-card">
          <p>学習計画が指定されていません。</p>
          <Link href="/learner/study" className="admin-btn">
            戻る
          </Link>
        </section>
      </LearnerShell>
    );
  }

  if (loading) {
    return (
      <LearnerShell title="学習管理">
        <p className="admin-loading">読み込み中…</p>
      </LearnerShell>
    );
  }

  if (!plan) {
    return (
      <LearnerShell title="学習管理">
        <section className="admin-card">
          <p>学習計画が見つかりません。</p>
          <Link href="/learner/study" className="admin-btn">
            戻る
          </Link>
        </section>
      </LearnerShell>
    );
  }

  return (
    <LearnerShell title="学習管理">
      <p className="study-back-link-wrap">
        <Link href="/learner/study" className="study-back-link">
          ← 学習管理に戻る
        </Link>
      </p>

      <header className="study-detail-header">
        <div>
          <h2 className="study-detail-header__title">{plan.subjectName}</h2>
          <p className="study-detail-header__meta">
            {plan.startDate.replace(/-/g, "/")} 〜 {plan.dueDate.replace(/-/g, "/")}
            <span className="study-detail-header__days">{formatDaysRemaining(plan.dueDate)}</span>
          </p>
          {plan.memo ? <p className="study-detail-header__memo">{plan.memo}</p> : null}
        </div>
        <div className="study-detail-header__actions">
          <button type="button" className="admin-btn" onClick={() => setEditing((v) => !v)}>
            {editing ? "編集をやめる" : "計画を編集"}
          </button>
          {plan.status === "active" ? (
            <button type="button" className="admin-btn" onClick={() => void markCompleted()}>
              完了にする
            </button>
          ) : (
            <button type="button" className="admin-btn" onClick={() => void markActive()}>
              再開する
            </button>
          )}
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            disabled={deleting}
            onClick={() => void handleDelete()}
          >
            削除
          </button>
        </div>
      </header>

      {!editing ? (
        <div className="study-detail-template-save">
          <StudySaveTemplateForm userId={userId} plan={plan} />
        </div>
      ) : null}

      {editing && subjectData && userId ? (
        <StudyPlanForm
          subjectData={subjectData}
          masters={masters}
          initial={initialInput}
          submitLabel="変更を保存"
          onSubmit={async (input) => {
            await updateStudyPlanMeta(userId, plan.id, {
              subjectId: isCustomSubjectId(input.subjectId)
                ? `custom:${input.subjectName}`
                : input.subjectId,
              subjectName: input.subjectName,
              startDate: input.startDate,
              dueDate: input.dueDate,
              memo: input.memo,
            });
            await replaceStudyItems(userId, plan.id, input.items, plan.items);
            await refresh(userId);
            setEditing(false);
          }}
        />
      ) : (
        <>
          <section className="admin-card study-detail-progress">
            <h3 className="study-detail-progress__title">計画全体の進捗</h3>
            <StudyProgressBar percent={progress} status={status} />
          </section>

          <section className="admin-card">
            <h3 className="shell-page-heading">学習内容ごとの進捗</h3>
            <ul className="study-item-editor-list">
              {plan.items.map((item) => (
                <StudyItemProgressEditor
                  key={item.id}
                  userId={userId}
                  planId={plan.id}
                  item={item}
                  onUpdated={(itemId, progressPercent) => {
                    setPlan((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        items: prev.items.map((i) =>
                          i.id === itemId ? { ...i, progressPercent } : i,
                        ),
                      };
                    });
                  }}
                />
              ))}
            </ul>
          </section>
        </>
      )}
    </LearnerShell>
  );
}

export default function LearnerStudyPlanPage() {
  return (
    <Suspense fallback={<p className="admin-loading">読み込み中…</p>}>
      <LearnerStudyPlanInner />
    </Suspense>
  );
}
