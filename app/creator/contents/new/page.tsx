"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ContentPeriodFields } from "@/components/admin/ContentPeriodFields";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { refreshWorkspaceUsageSnapshot } from "@/lib/billing/refresh-usage";
import { syncCreatorBillingState } from "@/lib/billing/starter";
import { checkWorkspaceUsage } from "@/lib/billing/usage";
import { currentContentPeriod } from "@/lib/content/period";
import { SLUG_PATTERN, type ContentType } from "@/lib/content/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import {
  createWorkspaceContent,
  ensureWorkspaceSubjects,
  isWorkspaceSlugTaken,
} from "@/lib/workspaces/content-firestore";
import { listWorkspaceSubjectsForForm } from "@/lib/workspaces/subjects-firestore";
import type { WorkspaceDoc, WorkspaceSubjectDoc } from "@/lib/workspaces/types";

export default function CreatorContentNewPage() {
  const router = useRouter();
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [subjects, setSubjects] = useState<WorkspaceSubjectDoc[]>([]);
  const [newType, setNewType] = useState<ContentType>("quiz");
  const [newSubjectId, setNewSubjectId] = useState("math");
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPeriodYear, setNewPeriodYear] = useState(currentContentPeriod().year);
  const [newPeriodMonth, setNewPeriodMonth] = useState(currentContentPeriod().month);

  const load = useCallback(async (userId: string) => {
    let workspace = await syncCreatorBillingState(userId);
    if (workspace) {
      workspace = (await refreshWorkspaceUsageSnapshot(workspace.id)) ?? workspace;
    }
    setWs(workspace);
    if (workspace) {
      await ensureWorkspaceSubjects(workspace.id);
      const formSubjects = await listWorkspaceSubjectsForForm(workspace.id);
      setSubjects(formSubjects);
      if (formSubjects.length) {
        setNewSubjectId(formSubjects[0].id);
      }
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setUid(user?.uid ?? "");
      void (async () => {
        if (!user) return;
        try {
          await load(user.uid);
        } catch (e) {
          setErr(e instanceof Error ? e.message : "読み込みに失敗しました。");
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [load]);

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
    setCreating(true);
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
      router.push(`/creator/contents/edit?id=${encodeURIComponent(id)}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "作成に失敗しました。");
      setCreating(false);
    }
  }

  return (
    <CreatorShell>
      <h2 className="shell-page-heading">教材を新規作成</h2>
      <p className="admin-msg" style={{ marginTop: 0 }}>
        <Link href="/creator">← 教材一覧へ</Link>
      </p>

      {loading ? <p className="admin-loading">読み込み中…</p> : null}
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}

      {!loading && !ws ? (
        <p className="admin-msg admin-msg--error">
          ワークスペースがありません。一度ログアウトし、クリエイター登録からやり直してください。
        </p>
      ) : null}

      {!loading && ws ? (
        <form className="admin-card" onSubmit={(e) => void onCreate(e)}>
          <div className="admin-field">
            <label htmlFor="new-type">形式</label>
            <select
              id="new-type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as ContentType)}
            >
              <option value="quiz">クイズ</option>
              <option value="lesson">レッスン</option>
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="new-subject">教科</label>
            <select
              id="new-subject"
              value={newSubjectId}
              onChange={(e) => setNewSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="new-slug">スラッグ</label>
            <input
              id="new-slug"
              placeholder="例: moon-move"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="new-title">タイトル</label>
            <input
              id="new-title"
              placeholder="教材のタイトル"
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
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={creating}
            >
              {creating ? "作成中…" : "作成して編集へ"}
            </button>
            <Link href="/creator" className="admin-btn">
              キャンセル
            </Link>
          </div>
        </form>
      ) : null}
    </CreatorShell>
  );
}
