"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { refreshWorkspaceUsageSnapshot } from "@/lib/billing/refresh-usage";
import { syncCreatorBillingState } from "@/lib/billing/starter";
import { checkWorkspaceUsage } from "@/lib/billing/usage";
import { currentContentPeriod } from "@/lib/content/period";
import { slugBaseFromTitle, slugCandidate } from "@/lib/content/slug";
import { DEFAULT_SUBJECTS } from "@/lib/content/subject-defaults";
import type { ContentType } from "@/lib/content/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import {
  createWorkspaceContent,
  ensureWorkspaceSubjects,
  isWorkspaceSlugTaken,
} from "@/lib/workspaces/content-firestore";
import { getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import { listWorkspaceSubjectsForForm } from "@/lib/workspaces/subjects-firestore";
import type { WorkspaceDoc, WorkspaceSubjectDoc } from "@/lib/workspaces/types";

const EXCLUDED_SUBJECT_IDS = new Set(["general"]);

function defaultSubjectChoices(): WorkspaceSubjectDoc[] {
  return DEFAULT_SUBJECTS.map((s) => ({
    id: s.id,
    name: s.name,
    order: s.order,
    status: "published",
    enabledInForm: s.enabledInForm,
  }));
}

function selectableSubjects(subjects: WorkspaceSubjectDoc[]): WorkspaceSubjectDoc[] {
  return subjects.filter((s) => !EXCLUDED_SUBJECT_IDS.has(s.id) && s.name !== "教材");
}

export default function CreatorContentNewPage() {
  const router = useRouter();
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [wsMissing, setWsMissing] = useState(false);
  const [wsPending, setWsPending] = useState(true);
  const [uid, setUid] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [subjects, setSubjects] = useState<WorkspaceSubjectDoc[]>(defaultSubjectChoices);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [newType, setNewType] = useState<ContentType>("quiz");
  const [newSubjectId, setNewSubjectId] = useState("math");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      if (!user) return;
      setUid(user.uid);
      setWsPending(true);
      setWsMissing(false);

      void (async () => {
        const workspace = await getWorkspaceByOwner(user.uid);
        if (!workspace) {
          setWsMissing(true);
          setWs(null);
          setWsPending(false);
          return;
        }

        setWsMissing(false);
        setWs(workspace);
        setWsPending(false);

        void (async () => {
          try {
            let updated = await syncCreatorBillingState(user.uid);
            if (updated) {
              updated = (await refreshWorkspaceUsageSnapshot(updated.id)) ?? updated;
            }
            if (updated) setWs(updated);
          } catch {
            /* 送信時の利用状況チェック用。初期 WS があればフォームは使える */
          }
        })();

        setSubjectsLoading(true);
        void (async () => {
          try {
            await ensureWorkspaceSubjects(workspace.id);
            const formSubjects = await listWorkspaceSubjectsForForm(workspace.id);
            setSubjects(formSubjects);
            const choices = selectableSubjects(formSubjects);
            if (choices.length) {
              setNewSubjectId((prev) =>
                choices.some((c) => c.id === prev) ? prev : choices[0].id,
              );
            }
          } catch (e) {
            setErr(e instanceof Error ? e.message : "教科の読み込みに失敗しました。");
          } finally {
            setSubjectsLoading(false);
          }
        })();
      })();
    });
    return unsub;
  }, []);

  const subjectChoices = useMemo(() => selectableSubjects(subjects), [subjects]);
  const formReady = !wsPending && ws != null && !subjectsLoading;

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!ws || !uid) return;
    setErr("");
    const title = newTitle.trim();
    if (!title) {
      setErr("タイトルを入力してください。");
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
    const base = slugBaseFromTitle(title);
    let slug = base;
    for (let attempt = 1; attempt <= 20; attempt += 1) {
      slug = slugCandidate(base, attempt);
      if (!(await isWorkspaceSlugTaken(ws.id, slug))) break;
      if (attempt === 20) slug = `item-${Date.now().toString(36)}`;
    }
    const period = currentContentPeriod();
    setCreating(true);
    try {
      const id = await createWorkspaceContent(ws.id, {
        subjectId: newSubjectId,
        type: newType,
        slug,
        title,
        periodYear: period.year,
        periodMonth: period.month,
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
      <p className="admin-field-hint creator-contents-hint">
        書きはじめた教材は下書きです。公開は編集画面からできます。
      </p>

      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}

      {wsMissing ? (
        <p className="admin-msg admin-msg--error">
          ワークスペースがありません。一度ログアウトし、クリエイター登録からやり直してください。
        </p>
      ) : (
        <form className="admin-card creator-content-new-form" onSubmit={(e) => void onCreate(e)}>
          {wsPending ? (
            <p className="admin-loading creator-content-new-form__status" role="status">
              ワークスペースを確認中…
            </p>
          ) : subjectsLoading ? (
            <p className="admin-loading creator-content-new-form__status" role="status">
              教科を読み込み中…
            </p>
          ) : null}

          <div className="admin-form-row">
            <fieldset className="admin-field admin-radio-field creator-content-new-form__type">
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
            <fieldset className="admin-field admin-radio-field creator-content-new-form__subject">
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
                      disabled={subjectsLoading}
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="admin-field creator-content-new-form__title">
            <label htmlFor="new-title">タイトル</label>
            <input
              id="new-title"
              placeholder="教材のタイトル"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>
          <div className="admin-row">
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={creating || !formReady || subjectChoices.length === 0 || !newTitle.trim()}
            >
              {creating ? "作成中…" : "書きはじめる"}
            </button>
          </div>
        </form>
      )}
    </CreatorShell>
  );
}
