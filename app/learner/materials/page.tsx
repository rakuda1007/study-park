"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  subjectDisplayName,
  subjectSortOrder,
} from "@/lib/content/subject-names";
import type { ContentManifest } from "@/lib/content/types";
import {
  loadLearnerHomeScaffold,
  loadLearnerWorkspaceContents,
  type LearnerHomeRow,
} from "@/lib/learner/home-rows";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import { JoinWorkspaceInviteForm } from "@/components/learner/JoinWorkspaceInviteForm";
import { LearnerBecomeCreatorCard } from "@/components/learner/LearnerBecomeCreatorCard";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { LearnerSubjectSection } from "@/components/learner/LearnerSubjectSection";
import { ContentPeriodFilter } from "@/components/admin/ContentPeriodFilter";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { CONTENT_PERIOD_FILTER_ALL } from "@/lib/content/period";
import { countContentsForDisplay } from "@/lib/content/pinned";
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

export default function LearnerMaterialsPage() {
  const manifest = contentManifest as ContentManifest;
  const searchParams = useSearchParams();
  const joinedWorkspaceId = searchParams.get("joined")?.trim() || undefined;
  const [rows, setRows] = useState<LearnerHomeRow[]>([]);
  const [subjectNames, setSubjectNames] = useState<Map<string, string>>(new Map());
  const [scaffoldLoading, setScaffoldLoading] = useState(true);
  const [contentsLoadingIds, setContentsLoadingIds] = useState<Set<string>>(() => new Set());
  const [userId, setUserId] = useState("");
  const [showCreatorUpgrade, setShowCreatorUpgrade] = useState(false);
  const [periodFilter, setPeriodFilter] = useState(CONTENT_PERIOD_FILTER_ALL);

  const loadWorkspaceContents = useCallback((workspaceId: string) => {
    setContentsLoadingIds((prev) => new Set(prev).add(workspaceId));
    void loadLearnerWorkspaceContents(workspaceId)
      .then((contents) => {
        setRows((prev) =>
          prev.map((row) =>
            row.workspaceId === workspaceId ? { ...row, contents } : row,
          ),
        );
      })
      .finally(() => {
        setContentsLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(workspaceId);
          return next;
        });
      });
  }, []);

  const refreshRows = useCallback(
    async (uid: string, ensureWorkspaceId?: string) => {
      setScaffoldLoading(true);
      try {
        const data = await loadLearnerHomeScaffold(uid, manifest, { ensureWorkspaceId });
        setRows(data.rows);
        setSubjectNames(data.subjectNames);
        for (const row of data.rows) {
          loadWorkspaceContents(row.workspaceId);
        }
      } finally {
        setScaffoldLoading(false);
      }
    },
    [loadWorkspaceContents, manifest],
  );

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      if (!user) return;
      setUserId(user.uid);
      void refreshRows(user.uid, joinedWorkspaceId);
      void backfillLearnerNamesIfEmpty(user.uid);
      void getUserProfile(user.uid).then((profile) => {
        setShowCreatorUpgrade(profile?.role === "learner");
      });
    });
    return unsub;
  }, [refreshRows, joinedWorkspaceId]);

  const rowsWithGroups = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        subjectGroups: groupBySubject(r.contents, subjectNames, manifest),
      })),
    [rows, subjectNames, manifest],
  );

  const allContents = useMemo(() => rows.flatMap((r) => r.contents), [rows]);

  function visibleItemCount(subjectGroups: SubjectGroup[]): number {
    return subjectGroups.reduce(
      (total, group) => total + countContentsForDisplay(group.items, periodFilter),
      0,
    );
  }

  return (
    <LearnerShell title="教材">
      <p className="admin-msg learner-welcome-msg">
        参加している教材を選んで学習できます。九九・県庁所在地は{" "}
        <Link href="/?park=1">トップページ</Link> からいつでも無料で利用できます。
      </p>

      {scaffoldLoading && rows.length === 0 ? (
        <p className="admin-loading" role="status">
          ワークスペースを確認中…
        </p>
      ) : null}

      {!scaffoldLoading && allContents.length > 0 ? (
        <div className="learner-period-toolbar">
          <ContentPeriodFilter
            contents={allContents}
            value={periodFilter}
            onChange={setPeriodFilter}
            storageKey="study-park-learner-content-period-filter"
          />
        </div>
      ) : null}

      {!scaffoldLoading && rows.length === 0 ? (
        <section className="admin-card">
          <p>まだ参加している教材がありません。下のフォームから招待コードを入力して参加してください。</p>
        </section>
      ) : null}

      {rowsWithGroups.map((r) => {
        const contentsLoading = contentsLoadingIds.has(r.workspaceId);

        return (
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
            {contentsLoading ? (
              <p className="admin-loading" role="status">
                教材を読み込み中…
              </p>
            ) : r.contents.length === 0 ? (
              <p className="admin-msg">公開中の教材はまだありません。</p>
            ) : visibleItemCount(r.subjectGroups) === 0 ? (
              <p className="admin-msg">選択した期間の教材はありません。</p>
            ) : (
              <div className="learner-subject-list">
                {r.subjectGroups.map((g) => (
                  <LearnerSubjectSection
                    key={g.subjectId}
                    group={g}
                    workspaceSlug={r.workspaceSlug}
                    periodFilter={periodFilter}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {userId && showCreatorUpgrade ? <LearnerBecomeCreatorCard /> : null}

      {userId ? (
        <JoinWorkspaceInviteForm
          userId={userId}
          onJoined={(result) => {
            void refreshRows(userId, result.workspaceId);
          }}
        />
      ) : null}
    </LearnerShell>
  );
}
