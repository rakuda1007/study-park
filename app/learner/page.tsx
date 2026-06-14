"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  subjectDisplayName,
  subjectSortOrder,
} from "@/lib/content/subject-names";
import type { ContentManifest } from "@/lib/content/types";
import { loadLearnerHomeRows, type LearnerHomeRow } from "@/lib/learner/home-rows";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import { JoinWorkspaceInviteForm } from "@/components/learner/JoinWorkspaceInviteForm";
import { LearnerBecomeCreatorCard } from "@/components/learner/LearnerBecomeCreatorCard";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { LearnerSubjectSection } from "@/components/learner/LearnerSubjectSection";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { backfillLearnerNamesIfEmpty, getUserProfile } from "@/lib/users/firestore";
import contentManifest from "@/public/content-manifest.json";

type SubjectGroup = {
  subjectId: string;
  subjectName: string;
  items: WorkspaceContentDoc[];
};

function groupBySubject(
  contents: WorkspaceContentDoc[],
  subjectNames: Map<string, string>,
  manifest: ContentManifest,
): SubjectGroup[] {
  const byId = new Map<string, WorkspaceContentDoc[]>();
  for (const c of contents) {
    const list = byId.get(c.subjectId) ?? [];
    list.push(c);
    byId.set(c.subjectId, list);
  }
  return [...byId.entries()]
    .map(([subjectId, items]) => ({
      subjectId,
      subjectName: subjectDisplayName(subjectNames, subjectId),
      items: items.sort((a, b) => a.order - b.order),
    }))
    .sort(
      (a, b) =>
        subjectSortOrder(manifest, a.subjectId) - subjectSortOrder(manifest, b.subjectId),
    );
}

export default function LearnerHomePage() {
  const manifest = contentManifest as ContentManifest;
  const [rows, setRows] = useState<LearnerHomeRow[]>([]);
  const [subjectNames, setSubjectNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [showCreatorUpgrade, setShowCreatorUpgrade] = useState(false);

  const refreshRows = useCallback(
    async (uid: string) => {
      const data = await loadLearnerHomeRows(uid, manifest);
      setRows(data.rows);
      setSubjectNames(data.subjectNames);
    },
    [manifest],
  );

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        setUserId(user.uid);
        try {
          await backfillLearnerNamesIfEmpty(user.uid);
          const profile = await getUserProfile(user.uid);
          setShowCreatorUpgrade(profile?.role === "learner");
          await refreshRows(user.uid);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [refreshRows]);

  const rowsWithGroups = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        subjectGroups: groupBySubject(r.contents, subjectNames, manifest),
      })),
    [rows, subjectNames, manifest],
  );

  return (
    <LearnerShell>
      <p className="admin-msg learner-welcome-msg">
        ここから、参加している教材を選んで学習できます。九九・県庁所在地は{" "}
        <Link href="/?park=1">トップページ</Link> からいつでも無料で利用できます。
      </p>

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading && rows.length === 0 ? (
        <section className="admin-card">
          <p>まだ参加している教材がありません。下のフォームから招待コードを入力して参加してください。</p>
        </section>
      ) : null}

      {rowsWithGroups.map((r) => (
        <section key={r.workspaceId} className="admin-card learner-workspace-card">
          <h2 className="learner-workspace-title">{r.workspaceName}</h2>
          <p className="learner-workspace-meta">
            {r.isOwnWorkspace ? (
              <>自分が作った教材</>
            ) : (
              <>
                提供：<strong>{r.ownerLabel}</strong>
              </>
            )}
          </p>
          {r.subjectGroups.length === 0 ? (
            <p className="admin-msg">公開中の教材はまだありません。</p>
          ) : (
            <div className="learner-subject-list">
              {r.subjectGroups.map((g) => (
                <LearnerSubjectSection
                  key={g.subjectId}
                  group={g}
                  workspaceSlug={r.workspaceSlug}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {!loading && userId && showCreatorUpgrade ? <LearnerBecomeCreatorCard /> : null}

      {!loading && userId ? (
        <JoinWorkspaceInviteForm
          userId={userId}
          onJoined={() => {
            void refreshRows(userId);
          }}
        />
      ) : null}
    </LearnerShell>
  );
}
