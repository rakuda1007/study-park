"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { LessonSectionEditor } from "@/components/admin/LessonSectionEditor";
import { QuizQuestionBodyEditor } from "@/components/admin/QuizQuestionBodyEditor";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { checkWorkspaceUsage } from "@/lib/billing/usage";
import { workspacePlayHref } from "@/lib/content/urls";
import {
  normalizeQuizQuestion,
  prepareQuizQuestionForSave,
} from "@/lib/content/quiz-question";
import { defaultQuizBlankMarker } from "@/lib/content/quiz-markers";
import { DEFAULT_QUIZ_QUESTION_BODY } from "@/lib/content/quiz-question";
import type { ContentStatus, LessonSection, QuizQuestion } from "@/lib/content/types";
import { SLUG_PATTERN } from "@/lib/content/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { getUserProfile } from "@/lib/users/firestore";
import {
  deleteWorkspaceContent,
  getWorkspaceContent,
  isWorkspaceSlugTaken,
  saveWorkspaceLessonSections,
  saveWorkspaceQuizQuestions,
  updateWorkspaceContent,
} from "@/lib/workspaces/content-firestore";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import type { ContentVisibility } from "@/lib/workspaces/types";
import { getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";

function EditInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [uid, setUid] = useState("");
  const [doc, setDoc] = useState<WorkspaceContentDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [intro, setIntro] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [ready, setReady] = useState(false);
  const [visibility, setVisibility] = useState<ContentVisibility>("members");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [sections, setSections] = useState<LessonSection[]>([]);

  useEffect(() => {
    const unsub = subscribeAuth((user) => setUid(user?.uid ?? ""));
    return unsub;
  }, []);

  const load = useCallback(async () => {
    if (!id || !uid) return;
    const workspace = await getWorkspaceByOwner(uid);
    setWs(workspace);
    if (!workspace) {
      setErr("ワークスペースが見つかりません。");
      return;
    }
    const c = await getWorkspaceContent(workspace.id, id);
    if (!c) {
      setErr("コンテンツが見つかりません。");
      return;
    }
    setDoc(c);
    setTitle(c.title);
    setSlug(c.slug);
    setIntro(c.intro ?? "");
    setStatus(c.status);
    setReady(c.ready);
    setVisibility(c.visibility);
    setQuestions((c.quiz?.questions ?? []).map(normalizeQuizQuestion));
    setSections(c.lesson?.sections ?? []);
  }, [id, uid]);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  async function onSave() {
    if (!doc || !ws || !uid) return;
    setErr("");
    setMsg("");
    const s = slug.trim().toLowerCase();
    if (!SLUG_PATTERN.test(s)) {
      setErr("slug は英小文字・数字・ハイフンのみです。");
      return;
    }
    if (await isWorkspaceSlugTaken(ws.id, s, doc.id)) {
      setErr("この slug は既に使われています。");
      return;
    }
    setSaving(true);
    const readyForSite = status === "published" ? true : ready;
    try {
      await updateWorkspaceContent(ws.id, doc.id, {
        title: title.trim(),
        slug: s,
        intro: intro.trim(),
        subjectId: "general",
        status,
        ready: readyForSite,
        visibility,
        updatedBy: uid,
      });
      if (doc.type === "quiz") {
        await saveWorkspaceQuizQuestions(
          ws.id,
          doc.id,
          questions.map(prepareQuizQuestionForSave),
          uid,
        );
      } else {
        await saveWorkspaceLessonSections(ws.id, doc.id, sections, uid);
      }
      setMsg("保存しました。");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!doc || !ws || !confirm(`「${doc.title}」を削除しますか？`)) return;
    await deleteWorkspaceContent(ws.id, doc.id);
    window.location.href = "/creator/contents";
  }

  function addQuestion() {
    if (!ws) return;
    void (async () => {
      const profile = await getUserProfile(uid);
      const usage = checkWorkspaceUsage(ws, "add_question", {
        hasActivePurchase: profile?.appPurchase.status === "active",
      });
      if (!usage.ok) {
        setErr(usage.reason);
        return;
      }
      const n = questions.length + 1;
      const defaultText = DEFAULT_QUIZ_QUESTION_BODY;
      setQuestions((prev) => [
        ...prev,
        {
          id: `q${String(n).padStart(2, "0")}`,
          number: n,
          label: `問${n}`,
          blocks: [{ kind: "paragraph", text: defaultText }],
          template: defaultText,
          blanks: [{ marker: defaultQuizBlankMarker(prev.length), answers: ["答え"] }],
        },
      ]);
    })();
  }

  if (!id) {
    return (
      <CreatorShell title="編集">
        <p className="admin-msg admin-msg--error">id がありません。</p>
      </CreatorShell>
    );
  }

  return (
    <CreatorShell title={doc ? `編集: ${doc.title}` : "編集"}>
      {loading ? <p className="admin-loading">読み込み中…</p> : null}
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}
      {msg ? <p className="admin-msg admin-msg--ok">{msg}</p> : null}

      {doc && ws ? (
        <>
          <section className="admin-card">
            <h2>基本情報</h2>
            <div className="admin-field">
              <label htmlFor="title">タイトル</label>
              <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="admin-field">
              <label htmlFor="slug">slug</label>
              <input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="admin-field">
              <label htmlFor="visibility">公開範囲</label>
              <select
                id="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ContentVisibility)}
              >
                <option value="members">学習者ログイン必須</option>
                <option value="unlisted">リンクを知っていれば可（ログイン不要）</option>
                <option value="private">非公開（下書き）</option>
              </select>
            </div>
            <div className="admin-row">
              <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)}>
                <option value="draft">下書き</option>
                <option value="published">公開</option>
                <option value="archived">アーカイブ</option>
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={ready}
                  onChange={(e) => setReady(e.target.checked)}
                />{" "}
                表示準備 OK
              </label>
            </div>
            {status === "published" ? (
              <p className="admin-msg">
                プレイ URL:{" "}
                <Link href={workspacePlayHref(ws.slug, slug)} target="_blank">
                  {workspacePlayHref(ws.slug, slug)}
                </Link>
              </p>
            ) : null}
          </section>

          {doc.type === "quiz" ? (
            <section className="admin-card">
              <h2>問題（{questions.length}問）</h2>
              {questions.map((q, qi) => (
                <div key={q.id} className="admin-question">
                  <div className="admin-row">
                    <div className="admin-field" style={{ flex: "1 1 6rem" }}>
                      <label>ラベル</label>
                      <input
                        value={q.label}
                        onChange={(e) =>
                          setQuestions((prev) =>
                            prev.map((item, i) =>
                              i === qi ? { ...item, label: e.target.value } : item,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                  <QuizQuestionBodyEditor
                    contentId={doc.id}
                    workspaceId={ws.id}
                    blocks={q.blocks ?? [{ kind: "paragraph", text: q.template }]}
                    onChange={(blocks, template) =>
                      setQuestions((prev) =>
                        prev.map((item, i) => (i === qi ? { ...item, blocks, template } : item)),
                      )
                    }
                  />
                </div>
              ))}
              <button type="button" className="admin-btn" onClick={() => addQuestion()}>
                ＋ 問題を追加
              </button>
            </section>
          ) : (
            <section className="admin-card">
              <h2>レッスン</h2>
              {sections.map((sec, si) => (
                <LessonSectionEditor
                  key={sec.id}
                  contentId={doc.id}
                  workspaceId={ws.id}
                  section={sec}
                  onChange={(next) =>
                    setSections((prev) => prev.map((s, i) => (i === si ? next : s)))
                  }
                />
              ))}
            </section>
          )}

          <div className="admin-row" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={saving}
              onClick={() => void onSave()}
            >
              {saving ? "保存中…" : "保存"}
            </button>
            <button type="button" className="admin-btn" onClick={() => void onDelete()}>
              削除
            </button>
            <Link href="/creator/contents" className="admin-link">
              一覧へ
            </Link>
          </div>
        </>
      ) : null}
    </CreatorShell>
  );
}

export default function CreatorEditPage() {
  return (
    <Suspense fallback={<p className="admin-loading">読み込み中…</p>}>
      <EditInner />
    </Suspense>
  );
}
