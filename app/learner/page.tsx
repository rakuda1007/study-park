"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildSubjectNameMap,
  subjectDisplayName,
  subjectSortOrder,
} from "@/lib/content/subject-names";
import type { ContentManifest } from "@/lib/content/types";
import { listPublicSubjects } from "@/lib/content/public-firestore";
import { listPublishedContentsForMember } from "@/lib/workspaces/content-firestore";
import { getWorkspace } from "@/lib/workspaces/firestore";
import { listWorkspacesForLearner } from "@/lib/workspaces/members";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { LearnerSubjectSection } from "@/components/learner/LearnerSubjectSection";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { backfillLearnerNamesIfEmpty } from "@/lib/users/firestore";
import contentManifest from "@/public/content-manifest.json";

type Row = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  contents: WorkspaceContentDoc[];
};

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
  const [rows, setRows] = useState<Row[]>([]);
  const [subjectNames, setSubjectNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        try {
          await backfillLearnerNamesIfEmpty(user.uid);
          const [memberships, subjects] = await Promise.all([
            listWorkspacesForLearner(user.uid),
            listPublicSubjects(),
          ]);
          setSubjectNames(buildSubjectNameMap(manifest, subjects));
          const data: Row[] = [];
          for (const m of memberships) {
            const ws = await getWorkspace(m.workspaceId);
            if (!ws) continue;
            const contents = await listPublishedContentsForMember(m.workspaceId);
            data.push({
              workspaceId: m.workspaceId,
              workspaceName: ws.name,
              workspaceSlug: ws.slug,
              contents,
            });
          }
          setRows(data);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [manifest]);

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
          <p>まだ参加している教材がありません。</p>
          <p>
            クリエイターから届いた招待コードがあれば、
            <Link href="/signup/learner"> こちらから参加</Link>
            できます。
          </p>
        </section>
      ) : null}

      {rowsWithGroups.map((r) => (
        <section key={r.workspaceId} className="admin-card learner-workspace-card">
          <h2 className="learner-workspace-title">{r.workspaceName}</h2>
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
    </LearnerShell>
  );
}
