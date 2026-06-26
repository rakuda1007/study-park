"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StudyItemMasterManager } from "@/components/learner/study/StudyItemMasterManager";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { loadStudySubjectData } from "@/lib/study/subject-options";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import contentManifest from "@/public/content-manifest.json";
import type { ContentManifest } from "@/lib/content/types";

export default function LearnerStudyMastersPage() {
  const manifest = contentManifest as ContentManifest;
  const [userId, setUserId] = useState("");
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        setUserId(user.uid);
        try {
          const data = await loadStudySubjectData(user.uid, manifest);
          setSubjects(data.subjects);
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
        <Link href="/learner" className="study-back-link">
          ← 学習管理に戻る
        </Link>
      </p>

      <h2 className="shell-page-heading">よく使う項目</h2>

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading && userId ? (
        <StudyItemMasterManager userId={userId} subjects={subjects} />
      ) : null}
    </LearnerShell>
  );
}
