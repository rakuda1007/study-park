"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentPeriodFilter } from "@/components/admin/ContentPeriodFilter";
import { CreatorSubjectSection, type CreatorSubjectGroup } from "@/components/creator/CreatorSubjectSection";
import { refreshWorkspaceUsageSnapshot } from "@/lib/billing/refresh-usage";
import { syncCreatorBillingState } from "@/lib/billing/starter";
import { CONTENT_PERIOD_FILTER_ALL } from "@/lib/content/period";
import { countContentsForDisplay } from "@/lib/content/pinned";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import {
  ensureWorkspaceSubjects,
  listWorkspaceContents,
} from "@/lib/workspaces/content-firestore";
import { listWorkspaceSubjectsForForm } from "@/lib/workspaces/subjects-firestore";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import type { WorkspaceDoc, WorkspaceSubjectDoc } from "@/lib/workspaces/types";

function groupBySubject(
  contents: WorkspaceContentDoc[],
  subjects: WorkspaceSubjectDoc[],
): CreatorSubjectGroup[] {
  const subjectOrder = new Map(subjects.map((s) => [s.id, s.order]));
  const subjectNames = new Map(subjects.map((s) => [s.id, s.name]));
  const byId = new Map<string, WorkspaceContentDoc[]>();

  for (const c of contents) {
    const list = byId.get(c.subjectId) ?? [];
    list.push(c);
    byId.set(c.subjectId, list);
  }

  return [...byId.entries()]
    .map(([subjectId, items]) => ({
      subjectId,
      subjectName: subjectNames.get(subjectId) ?? subjectId,
      items: items.sort((a, b) => a.order - b.order),
    }))
    .sort(
      (a, b) =>
        (subjectOrder.get(a.subjectId) ?? 999) - (subjectOrder.get(b.subjectId) ?? 999),
    );
}

export function CreatorContentsSection() {
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [items, setItems] = useState<WorkspaceContentDoc[]>([]);
  const [subjects, setSubjects] = useState<WorkspaceSubjectDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [periodFilter, setPeriodFilter] = useState(CONTENT_PERIOD_FILTER_ALL);

  const reload = useCallback(async (workspaceId: string) => {
    await ensureWorkspaceSubjects(workspaceId);
    const [list, formSubjects] = await Promise.all([
      listWorkspaceContents(workspaceId),
      listWorkspaceSubjectsForForm(workspaceId),
    ]);
    setItems(list);
    setSubjects(formSubjects);
  }, []);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        try {
          let workspace = await syncCreatorBillingState(user.uid);
          if (workspace) {
            workspace = (await refreshWorkspaceUsageSnapshot(workspace.id)) ?? workspace;
          }
          setWs(workspace);
          if (workspace) await reload(workspace.id);
        } catch (e) {
          setErr(e instanceof Error ? e.message : "読み込みに失敗しました。");
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [reload]);

  const subjectGroups = useMemo(
    () => groupBySubject(items, subjects),
    [items, subjects],
  );

  const visibleCount = countContentsForDisplay(items, periodFilter);

  function visibleItemCount(groups: CreatorSubjectGroup[]): number {
    return groups.reduce(
      (total, group) => total + countContentsForDisplay(group.items, periodFilter),
      0,
    );
  }

  if (loading) {
    return <p className="admin-loading">教材を読み込み中…</p>;
  }

  if (!ws) return null;

  return (
    <>
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}

      <div className="creator-contents-header">
        <Link href="/creator/contents/new" className="admin-btn admin-btn--primary">
          教材を新規作成
        </Link>
      </div>

      <section className="admin-card learner-workspace-card">
        <h2 className="learner-workspace-title">{ws.name}</h2>
        <p className="learner-workspace-meta">自分が作った教材</p>

        {items.length > 0 ? (
          <div className="learner-period-toolbar">
            <ContentPeriodFilter
              contents={items}
              value={periodFilter}
              onChange={setPeriodFilter}
              storageKey="study-park-creator-content-period-filter"
            />
          </div>
        ) : null}

        {items.length === 0 ? (
          <p className="admin-msg">
            まだ教材がありません。「教材を新規作成」から追加してください。
          </p>
        ) : visibleItemCount(subjectGroups) === 0 ? (
          <p className="admin-msg">選択した期間の教材はありません。</p>
        ) : (
          <div className="learner-subject-list">
            {subjectGroups.map((g) => (
              <CreatorSubjectSection
                key={g.subjectId}
                group={g}
                periodFilter={periodFilter}
              />
            ))}
          </div>
        )}

        {items.length > 0 ? (
          <p className="admin-msg creator-contents-count" role="status">
            表示 {visibleCount}件 / 全 {items.length}件
          </p>
        ) : null}
      </section>
    </>
  );
}
