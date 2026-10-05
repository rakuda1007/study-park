"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { StudyItemMasterManager } from "@/components/learner/study/StudyItemMasterManager";
import { StudyPlanForm } from "@/components/learner/study/StudyPlanForm";
import { StudyTemplateList } from "@/components/learner/study/StudyTemplateList";
import { StudyTemplatePicker } from "@/components/learner/study/StudyTemplatePicker";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { customSubjectOption, isCustomSubjectId } from "@/lib/study/subject-options";
import { createStudyPlan, countActiveStudyPlans } from "@/lib/study/firestore";
import { isStudyActivePlanAtLimit, studyActivePlanUsageLabel } from "@/lib/study/limits";
import { invalidateStudyPlansCache } from "@/lib/study/plans-loader";
import { listStudyItemMasters } from "@/lib/study/masters-firestore";
import { loadStudySubjectData } from "@/lib/study/subject-options";
import type { StudySubjectData } from "@/lib/study/subject-options";
import {
  listStudyTemplates,
  templateToPlanInput,
} from "@/lib/study/templates-firestore";
import type { StudyPlanInput, StudyTemplateDoc } from "@/lib/study/types";
import { learnerHomeHref } from "@/lib/study/urls";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { StudyActivePlanUsageBanner } from "@/components/learner/study/StudyActivePlanUsageBanner";
import contentManifest from "@/public/content-manifest.json";
import type { ContentManifest } from "@/lib/content/types";

const MANAGE_HASHES = new Set(["#study-plan-templates", "#study-plan-masters"]);

function openManageSectionFromHash() {
  if (typeof window === "undefined") return;
  const hash = window.location.hash;
  if (!MANAGE_HASHES.has(hash)) return;
  const details = document.getElementById("study-plan-tools");
  if (details instanceof HTMLDetailsElement) {
    details.open = true;
  }
  document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LearnerStudyNewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const manifest = contentManifest as ContentManifest;
  const [userId, setUserId] = useState("");
  const [subjectData, setSubjectData] = useState<StudySubjectData | null>(null);
  const [templates, setTemplates] = useState<StudyTemplateDoc[]>([]);
  const [masters, setMasters] = useState<Awaited<ReturnType<typeof listStudyItemMasters>>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    () => searchParams.get("templateId") ?? "",
  );
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        setUserId(user.uid);
        try {
          const [data, templateList, masterList, active] = await Promise.all([
            loadStudySubjectData(user.uid, manifest),
            listStudyTemplates(user.uid),
            listStudyItemMasters(user.uid),
            countActiveStudyPlans(user.uid),
          ]);
          setSubjectData(data);
          setTemplates(templateList);
          setMasters(masterList);
          setActiveCount(active);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [manifest]);

  useEffect(() => {
    if (loading) return;
    openManageSectionFromHash();
    const onHashChange = () => openManageSectionFromHash();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [loading]);

  const handleTemplatesChanged = useCallback((next: StudyTemplateDoc[]) => {
    setTemplates(next);
  }, []);

  const handleMastersChanged = useCallback(
    (next: Awaited<ReturnType<typeof listStudyItemMasters>>) => {
      setMasters(next);
    },
    [],
  );

  const formInitial = useMemo((): StudyPlanInput | undefined => {
    if (!selectedTemplateId) return undefined;
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return undefined;
    const input = templateToPlanInput(template);
    const subjectId = input.subjectId.startsWith("custom:")
      ? customSubjectOption().id
      : input.subjectId;
    return { ...input, subjectId };
  }, [selectedTemplateId, templates]);

  const formKey = selectedTemplateId || "blank";

  return (
    <LearnerShell title="学習管理">
      <p className="study-back-link-wrap">
        <Link href="/learner" className="study-back-link">
          ← 学習管理に戻る
        </Link>
      </p>

      <h2 className="shell-page-heading">学習計画を追加</h2>

      {!loading ? (
        <>
          <p className="admin-msg">{studyActivePlanUsageLabel(activeCount)}</p>
          <StudyActivePlanUsageBanner activeCount={activeCount} />
        </>
      ) : null}

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading && subjectData && userId && !isStudyActivePlanAtLimit(activeCount) ? (
        <>
          <StudyTemplatePicker
            templates={templates}
            selectedId={selectedTemplateId}
            onSelect={setSelectedTemplateId}
          />
          <StudyPlanForm
            key={formKey}
            subjectData={subjectData}
            masters={masters}
            initial={formInitial}
            submitLabel="保存する"
            mastersManageHref="#study-plan-masters"
            onSubmit={async (input) => {
              await createStudyPlan(userId, {
                ...input,
                subjectId: isCustomSubjectId(input.subjectId)
                  ? `custom:${input.subjectName}`
                  : input.subjectId,
              });
              invalidateStudyPlansCache(userId);
              router.push(learnerHomeHref({ createdSubject: input.subjectName }));
            }}
          />
        </>
      ) : null}

      {!loading && subjectData && userId ? (
        <details id="study-plan-tools" className="study-new-manage">
          <summary className="study-new-manage__summary">
            計画テンプレ・よく使う教材名の管理
          </summary>
          <div className="study-new-manage__body">
            <section id="study-plan-templates" className="study-new-manage__section">
              <h3 className="study-new-manage__heading">計画テンプレ</h3>
              <p className="admin-msg">
                よく使う学習計画の構成です。計画の「記録する」画面から「計画テンプレに残す」ができます。
              </p>
              <StudyTemplateList
                userId={userId}
                showApply={!isStudyActivePlanAtLimit(activeCount)}
                showCreateLink={false}
                onApply={(template) => {
                  setSelectedTemplateId(template.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onChanged={handleTemplatesChanged}
              />
            </section>
            <section id="study-plan-masters" className="study-new-manage__section">
              <h3 className="study-new-manage__heading">よく使う教材名</h3>
              <StudyItemMasterManager
                userId={userId}
                subjects={subjectData.subjects}
                onMastersChange={handleMastersChanged}
                showNewPlanHint={false}
              />
            </section>
          </div>
        </details>
      ) : null}
    </LearnerShell>
  );
}

export default function LearnerStudyNewPage() {
  return (
    <Suspense fallback={<p className="admin-loading">読み込み中…</p>}>
      <LearnerStudyNewInner />
    </Suspense>
  );
}
