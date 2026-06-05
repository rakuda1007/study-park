"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { checkWorkspaceUsage } from "@/lib/billing/usage";
import { workspacePlayHref } from "@/lib/content/urls";
import { SLUG_PATTERN } from "@/lib/content/types";
import type { ContentType } from "@/lib/content/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import {
  createWorkspaceContent,
  ensureWorkspaceSubjects,
  isWorkspaceSlugTaken,
  listWorkspaceContents,
} from "@/lib/workspaces/content-firestore";
import { getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";

export default function CreatorContentsPage() {
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [items, setItems] = useState<WorkspaceContentDoc[]>([]);
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [newType, setNewType] = useState<ContentType>("quiz");
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const reload = useCallback(async (workspaceId: string) => {
    await ensureWorkspaceSubjects(workspaceId);
    const list = await listWorkspaceContents(workspaceId);
    setItems(list);
  }, []);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setUid(user?.uid ?? "");
      void (async () => {
        if (!user) return;
        try {
          const workspace = await getWorkspaceByOwner(user.uid);
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
        subjectId: "general",
        type: newType,
        slug,
        title: newTitle.trim() || slug,
        updatedBy: uid,
        visibility: "members",
      });
      await reload(ws.id);
      window.location.href = `/creator/contents/edit?id=${encodeURIComponent(id)}`;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "作成に失敗しました。");
    }
  }

  if (loading) {
    return (
      <CreatorShell title="教材一覧">
        <p className="admin-loading">読み込み中…</p>
      </CreatorShell>
    );
  }

  return (
    <CreatorShell title="教材一覧">
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}
      {ws ? (
        <>
          <form className="admin-card" onSubmit={(e) => void onCreate(e)}>
            <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>新規作成</h2>
            <div className="admin-row">
              <select value={newType} onChange={(e) => setNewType(e.target.value as ContentType)}>
                <option value="quiz">クイズ</option>
                <option value="lesson">レッスン</option>
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
              <button type="submit" className="admin-btn admin-btn--primary">
                作成
              </button>
            </div>
          </form>

          <ul className="admin-list" style={{ marginTop: "1rem" }}>
            {items.map((c) => (
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
          {items.length === 0 ? (
            <p className="admin-msg">まだ教材がありません。上のフォームから作成してください。</p>
          ) : null}
        </>
      ) : null}
    </CreatorShell>
  );
}
