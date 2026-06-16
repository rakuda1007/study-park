"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StudyTemplateList } from "@/components/learner/study/StudyTemplateList";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { subscribeAuth } from "@/lib/firebase/auth-client";

export default function LearnerStudyTemplatesPage() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setUserId(user?.uid ?? "");
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <LearnerShell title="学習管理">
      <p className="study-back-link-wrap">
        <Link href="/learner/study" className="study-back-link">
          ← 学習管理に戻る
        </Link>
      </p>

      <h2 className="shell-page-heading">テンプレート</h2>
      <p className="admin-msg">
        よく使う学習計画の構成を保存しておけます。計画詳細画面から「テンプレートとして保存」できます。
      </p>

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading && userId ? <StudyTemplateList userId={userId} /> : null}
    </LearnerShell>
  );
}
