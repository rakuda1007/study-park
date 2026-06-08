"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ContentPeriodFields } from "@/components/admin/ContentPeriodFields";
import { ContentPeriodFilter } from "@/components/admin/ContentPeriodFilter";
import { refreshWorkspaceUsageSnapshot } from "@/lib/billing/refresh-usage";
import { syncCreatorBillingState } from "@/lib/billing/starter";
import { checkWorkspaceUsage } from "@/lib/billing/usage";
import { workspacePlayHref } from "@/lib/content/urls";
import { SLUG_PATTERN } from "@/lib/content/types";
import {
  CONTENT_PERIOD_FILTER_ALL,
  contentMatchesPeriodFilter,
  currentContentPeriod,
  groupByContentPeriod,
  resolveContentPeriod,
} from "@/lib/content/period";
import type { ContentType } from "@/lib/content/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import {
  createWorkspaceContent,
  ensureWorkspaceSubjects,
  isWorkspaceSlugTaken,
  listWorkspaceContents,
} from "@/lib/workspaces/content-firestore";
import { listWorkspaceSubjectsForForm } from "@/lib/workspaces/subjects-firestore";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import type { WorkspaceDoc, WorkspaceSubjectDoc } from "@/lib/workspaces/types";

export function CreatorContentsSection() {
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [items, setItems] = useState<WorkspaceContentDoc[]>([]);
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [subjects, setSubjects] = useState<WorkspaceSubjectDoc[]>([]);
  const [newType, setNewType] = useState<ContentType>("quiz");
  const [newSubjectId, setNewSubjectId] = useState("math");
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [periodFilter, setPeriodFilter] = useState(CONTENT_PERIOD_FILTER_ALL);
  const [newPeriodYear, setNewPeriodYear] = useState(currentContentPeriod().year);
  const [newPeriodMonth, setNewPeriodMonth] = useState(currentContentPeriod().month);

  const reload = useCallback(async (workspaceId: string) => {
    await ensureWorkspaceSubjects(workspaceId);
    const [list, formSubjects] = await Promise.all([
      listWorkspaceContents(workspaceId),
      listWorkspaceSubjectsForForm(workspaceId),
    ]);
    setItems(list);
    setSubjects(formSubjects);
    if (formSubjects.length && !formSubjects.some((s) => s.id === newSubjectId)) {
      setNewSubjectId(formSubjects[0].id);
    }
  }, [newSubjectId]);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setUid(user?.uid ?? "");
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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!ws || !uid) return;
    setErr("");
    const slug = newSlug.trim().toLowerCase();
    if (!SLUG_PATTERN.test(slug)) {
      setErr("スラッグは英小文字・数字・ハイフンのみです。");
      return;
    }
    const createCheck = checkWorkspaceUsage(ws, "create_content");
    if (!createCheck.ok) {
      setErr(createCheck.reason);
      return;
    }
    const usage = checkWorkspaceUsage(ws, "add_question");
    if (!usage.ok) {
      setErr(usage.reason);
      return;
    }
    if (await isWorkspaceSlugTaken(ws.id, slug)) {
      setErr("このスラッグは既に使われています。");
      return;
    }
    try {
      const id = await createWorkspaceContent(ws.id, {
        subjectId: newSubjectId,
        type: newType,
        slug,
        title: newTitle.trim() || slug,
        periodYear: newPeriodYear,
        periodMonth: newPeriodMonth,
        updatedBy: uid,
        visibility: "members",
      });
      await reload(ws.id);
      window.location.href = `/creator/contents/edit?id=${encodeURIComponent(id)}`;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "作成に失敗しました。");
    }
  }

  const filteredItems = useMemo(
    () => items.filter((c) => contentMatchesPeriodFilter(c, periodFilter)),
    [items, periodFilter],
  );
  const groupedItems = useMemo(
    () =>
      groupByContentPeriod(filteredItems, (item) => resolveContentPeriod(item)).map(
        (group) => ({
          ...group,
          items: group.items.sort((a, b) => a.order - b.order),
        }),
      ),
    [filteredItems],
  );

  if (loading) {
    return <p className="admin-loading">教材を読み込み中…</p>;
  }

  if (!ws) return null;

  return (
    <>
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}

      <form className="admin-card" onSubmit={(e) => void onCreate(e)}>
        <h2 className="admin-card__heading">新規作成</h2>
        <div className="admin-row">
          <select value={newType} onChange={(e) => setNewType(e.target.value as ContentType)}>
            <option value="quiz">クイズ</option>
            <option value="lesson">レッスン</option>
          </select>
          <select
            value={newSubjectId}
            onChange={(e) => setNewSubjectId(e.target.value)}
            aria-label="教科"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            placeholder="スラッグ"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            required
          />
          <input
            placeholder="タイトル"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </div>
        <ContentPeriodFields
          year={newPeriodYear}
          month={newPeriodMonth}
          onYearChange={setNewPeriodYear}
          onMonthChange={setNewPeriodMonth}
        />
        <div className="admin-row">
          <button type="submit" className="admin-btn admin-btn--primary">
            作成
          </button>
        </div>
      </form>

      <div className="admin-list-toolbar" style={{ marginTop: "1rem" }}>
        <h2 className="admin-card__heading" style={{ margin: 0 }}>
          教材一覧（{filteredItems.length}件）
        </h2>
        <ContentPeriodFilter
          contents={items}
          value={periodFilter}
          onChange={setPeriodFilter}
          storageKey="study-park-creator-content-period-filter"
        />
      </div>

      <div style={{ marginTop: "0.75rem" }}>
        {groupedItems.map((group) => (
          <div key={group.key} className="admin-period-group">
            <h4>{group.label}</h4>
            <ul className="admin-list">
              {group.items.map((c) => (
                <li key={c.id} className="admin-list-item">
                  <div>
                    <strong>{c.title}</strong>（{c.type} / {c.status} / {c.visibility}）
                    <br />
                    <code>{workspacePlayHref(ws.slug, c.slug)}</code>
                  </div>
                  <Link
                    href={`/creator/contents/edit?id=${encodeURIComponent(c.id)}`}
                    className="admin-btn"
                  >
                    編集
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {filteredItems.length === 0 ? (
        <p className="admin-msg">
          {items.length === 0
            ? "まだ教材がありません。上のフォームから作成してください。"
            : "選択した期間の教材はありません。"}
        </p>
      ) : null}
    </>
  );
}
