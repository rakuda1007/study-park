"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LearnerShell } from "@/components/learner/LearnerShell";

/** よく使う教材名の管理は「学習計画を追加」画面に集約 */
export default function LearnerStudyMastersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/learner/study/new#study-plan-masters");
  }, [router]);

  return (
    <LearnerShell title="学習管理">
      <p className="admin-loading">学習計画の追加へ移動しています…</p>
    </LearnerShell>
  );
}
