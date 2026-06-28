"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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

const EXCLUDED_SUBJECT_IDS = new Set(["general"]);

function selectableSubjects(subjects: WorkspaceSubjectDoc[]): WorkspaceSubjectDoc[] {
  return subjects.filter((s) => !EXCLUDED_SUBJECT_IDS.has(s.id) && s.name !== "教材");
}

export default function CreatorContentNewPage() {
  const router = useRouter();
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [subjects, setSubjects] = useState<WorkspaceSubjectDoc[]>([]);
  const [newType, setNewType] = useState<ContentType>("quiz");
  const [newSubjectId, setNewSubjectId] = useState("");
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
      const choices = selectableSubjects(formSubjects);
      if (choices.length) {
        setNewSubjectId(choices[0].id);
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

  const subjectChoices = useMemo(() => selectableSubjects(subjects), [subjects]);

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
          <fieldset className="admin-field admin-radio-field">
            <legend>形式</legend>
            <div className="admin-radio-group">
              <label className="admin-radio-option">
                <input
                  type="radio"
                  name="new-type"
                  value="quiz"
                  checked={newType === "quiz"}
                  onChange={() => setNewType("quiz")}
                />
                <span>クイズ</span>
              </label>
              <label className="admin-radio-option">
                <input
                  type="radio"
                  name="new-type"
                  value="lesson"
                  checked={newType === "lesson"}
                  onChange={() => setNewType("lesson")}
                />
                <span>レッスン</span>
              </label>
            </div>
          </fieldset>
          <fieldset className="admin-field admin-radio-field">
            <legend>教科</legend>
            <div className="admin-radio-group">
              {subjectChoices.map((s) => (
                <label key={s.id} className="admin-radio-option">
                  <input
                    type="radio"
                    name="new-subject"
                    value={s.id}
                    checked={newSubjectId === s.id}
                    onChange={() => setNewSubjectId(s.id)}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="admin-field">
            <label htmlFor="new-title">タイトル</label>
            <input
              id="new-title"
              placeholder="教材のタイトル"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
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
              disabled={creating || subjectChoices.length === 0}
            >
              {creating ? "作成中…" : "本編を作成する"}
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
