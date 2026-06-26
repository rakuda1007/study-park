"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { StudyItemProgressEditor } from "@/components/learner/StudyItemProgressEditor";
import { StudyPlanForm } from "@/components/learner/StudyPlanForm";
import { StudyProgressGauge } from "@/components/learner/StudyProgressGauge";
import { StudySaveTemplateForm } from "@/components/learner/StudySaveTemplateForm";
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
import { invalidateStudyPlansCache } from "@/lib/study/plans-loader";
import {
  averageProgress,
  delayStatus,
} from "@/lib/study/progress";
import type { StudyPlanInput, StudyPlanWithItems, StudyItemMasterDoc } from "@/lib/study/types";
import { formatDaysRemaining } from "@/lib/study/week";
import { studyPlanHref } from "@/lib/study/urls";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import contentManifest from "@/public/content-manifest.json";
import type { ContentManifest } from "@/lib/content/types";

function LearnerStudyPlanInner() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const wantsEdit = searchParams.get("edit") === "1";
  const router = useRouter();
  const manifest = contentManifest as ContentManifest;

  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState<StudyPlanWithItems | null>(null);
  const [subjectData, setSubjectData] = useState<StudySubjectData | null>(null);
  const [masters, setMasters] = useState<StudyItemMasterDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingDataLoading, setEditingDataLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionErr, setActionErr] = useState("");

  const refreshPlan = useCallback(
    async (uid: string) => {
      if (!planId) {
        setPlan(null);
        return;
      }
      const data = await getStudyPlanWithItems(uid, planId);
      setPlan(data);
    },
    [planId],
  );

  const loadEditingData = useCallback(
    async (uid: string) => {
      setEditingDataLoading(true);
      try {
        const [subjects, masterList] = await Promise.all([
          loadStudySubjectData(uid, manifest),
          listStudyItemMasters(uid),
        ]);
        setSubjectData(subjects);
        setMasters(masterList);
      } finally {
        setEditingDataLoading(false);
      }
    },
    [manifest],
  );

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        setUserId(user.uid);
        try {
          await refreshPlan(user.uid);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [refreshPlan]);

  useEffect(() => {
    if (!editing || !userId || subjectData) return;
    void loadEditingData(userId);
  }, [editing, userId, subjectData, loadEditingData]);

  useEffect(() => {
    if (wantsEdit && plan && userId && !loading) {
      setEditing(true);
    }
  }, [wantsEdit, plan, userId, loading]);

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
        id: item.id,
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
      invalidateStudyPlansCache(userId);
      router.push("/learner");
    } finally {
      setDeleting(false);
    }
  }

  async function markCompleted() {
    if (!userId || !plan) return;
    await updateStudyPlanMeta(userId, plan.id, { status: "completed" });
    setPlan((prev) => (prev ? { ...prev, status: "completed" } : prev));
    invalidateStudyPlansCache(userId);
  }

  async function markActive() {
    if (!userId || !plan) return;
    setActionErr("");
    try {
      await updateStudyPlanMeta(userId, plan.id, { status: "active" });
      setPlan((prev) => (prev ? { ...prev, status: "active", completedAt: undefined } : prev));
      invalidateStudyPlansCache(userId);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "再開に失敗しました。");
    }
  }

  if (!planId) {
    return (
      <LearnerShell title="学習管理">
        <section className="admin-card">
          <p>学習計画が指定されていません。</p>
          <Link href="/learner" className="admin-btn">
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
          <Link href="/learner" className="admin-btn">
            戻る
          </Link>
        </section>
      </LearnerShell>
    );
  }

  return (
    <LearnerShell title="学習管理">
      <p className="study-back-link-wrap">
        <Link href="/learner" className="study-back-link">
          ← 学習管理に戻る
        </Link>
      </p>

      <header className="study-detail-header">
        <div>
          <h2 className="study-detail-header__title">{plan.subjectName}</h2>
          <p className="study-detail-header__meta">
            {plan.startDate.replace(/-/g, "/")} 〜 {plan.dueDate.replace(/-/g, "/")}
            <span className="study-detail-header__days">
              {formatDaysRemaining(
                plan.dueDate,
                new Date(),
                progress >= 100 || plan.status === "completed",
              )}
            </span>
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

      {actionErr ? <p className="admin-err">{actionErr}</p> : null}

      {!editing ? (
        <div className="study-detail-template-save">
          <StudySaveTemplateForm userId={userId} plan={plan} />
        </div>
      ) : null}

      {editing && editingDataLoading ? (
        <p className="admin-loading">編集データを読み込み中…</p>
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
            await refreshPlan(userId);
            invalidateStudyPlansCache(userId);
            setEditing(false);
            if (wantsEdit) {
              router.replace(studyPlanHref(plan.id));
            }
          }}
        />
      ) : (
        <>
          <section className="admin-card study-detail-progress">
            <h3 className="study-detail-progress__title">計画全体の進捗</h3>
            <StudyProgressGauge percent={progress} status={status} size="md" />
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
