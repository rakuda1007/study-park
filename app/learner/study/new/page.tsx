"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StudyPlanForm } from "@/components/learner/study/StudyPlanForm";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { createStudyPlan } from "@/lib/study/firestore";
import { loadStudySubjectData } from "@/lib/study/subject-options";
import type { StudySubjectData } from "@/lib/study/subject-options";
import { studyPlanHref } from "@/lib/study/urls";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import contentManifest from "@/public/content-manifest.json";
import type { ContentManifest } from "@/lib/content/types";

export default function LearnerStudyNewPage() {
  const router = useRouter();
  const manifest = contentManifest as ContentManifest;
  const [userId, setUserId] = useState("");
  const [subjectData, setSubjectData] = useState<StudySubjectData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        setUserId(user.uid);
        try {
          const data = await loadStudySubjectData(user.uid, manifest);
          setSubjectData(data);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [manifest]);

  return (
    <LearnerShell title="学習管理">
      <p className="study-back-link-wrap">
        <Link href="/learner/study" className="study-back-link">
          ← 学習管理に戻る
        </Link>
      </p>

      <h2 className="shell-page-heading">学習計画を追加</h2>

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading && subjectData && userId ? (
        <StudyPlanForm
          subjectData={subjectData}
          submitLabel="保存する"
          onSubmit={async (input) => {
            const planId = await createStudyPlan(userId, input);
            router.push(studyPlanHref(planId));
          }}
        />
      ) : null}
    </LearnerShell>
  );
}
