"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { LessonSectionsEditor } from "@/components/admin/LessonSectionsEditor";
import { QuizQuestionBodyEditor } from "@/components/admin/QuizQuestionBodyEditor";
import { AdSenseUnit } from "@/components/ads/AdSenseUnit";
import { ContentPeriodFields } from "@/components/admin/ContentPeriodFields";
import { ContentPinnedField } from "@/components/admin/ContentPinnedField";
import { RichTextArea } from "@/components/admin/RichTextArea";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { shouldShowAdsForPlan } from "@/lib/ads/visibility";
import { getWorkspaceShowAds } from "@/lib/workspaces/ad-flags";
import { refreshWorkspaceUsageSnapshot } from "@/lib/billing/refresh-usage";
import { syncCreatorBillingState } from "@/lib/billing/starter";
import { checkWorkspaceUsage } from "@/lib/billing/usage";
import { workspacePlayHref } from "@/lib/content/urls";
import {
  DEFAULT_QUIZ_QUESTION_BODY,
  nextQuizQuestionLabel,
  normalizeQuizQuestion,
  prepareQuizQuestionForSave,
  quizQuestionNumberFromLabel,
} from "@/lib/content/quiz-question";
import { DEFAULT_QUIZ_BLANK_ANSWERS, blankAnswersToInput, parseBlankAnswersInput } from "@/lib/content/quiz-answers";
import { defaultQuizBlankMarker } from "@/lib/content/quiz-markers";
import type { BlankAnswer, ContentStatus, LessonSection, QuizQuestion } from "@/lib/content/types";
import { SLUG_PATTERN } from "@/lib/content/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";
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
import { syncWorkspaceAdFlag } from "@/lib/workspaces/ad-flags";
import { getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import { listWorkspaceSubjectsForForm } from "@/lib/workspaces/subjects-firestore";
import type { WorkspaceDoc, WorkspaceSubjectDoc } from "@/lib/workspaces/types";

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

  const [subjects, setSubjects] = useState<WorkspaceSubjectDoc[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subjectId, setSubjectId] = useState("math");
  const [intro, setIntro] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [ready, setReady] = useState(false);
  const [visibility, setVisibility] = useState<ContentVisibility>("members");
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [pinned, setPinned] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [showAds, setShowAds] = useState(false);

  useEffect(() => {
    const unsub = subscribeAuth((user) => setUid(user?.uid ?? ""));
    return unsub;
  }, []);

  const load = useCallback(async () => {
    if (!id || !uid) return;
    let workspace = await syncCreatorBillingState(uid);
    if (workspace) {
      workspace = (await refreshWorkspaceUsageSnapshot(workspace.id)) ?? workspace;
    }
    setWs(workspace);
    if (workspace) {
      await syncWorkspaceAdFlag(workspace.id, workspace.planId);
      setShowAds(
        (await getWorkspaceShowAds(workspace.id)) && shouldShowAdsForPlan(workspace.planId),
      );
    }
    if (!workspace) {
      setErr("ワークスペースが見つかりません。");
      return;
    }
    const c = await getWorkspaceContent(workspace.id, id);
    if (!c) {
      setErr("コンテンツが見つかりません。");
      return;
    }
    const formSubjects = await listWorkspaceSubjectsForForm(workspace.id, c.subjectId);
    setSubjects(formSubjects);
    setDoc(c);
    setTitle(c.title);
    setSlug(c.slug);
    setSubjectId(c.subjectId);
    setIntro(c.intro ?? "");
    setStatus(c.status);
    setReady(c.ready);
    setVisibility(c.visibility);
    setPeriodYear(c.periodYear);
    setPeriodMonth(c.periodMonth);
    setPinned(c.pinned === true);
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
    const editCheck = checkWorkspaceUsage(ws, "edit_content");
    if (!editCheck.ok) {
      setErr(editCheck.reason);
      return;
    }
    setSaving(true);
    const readyForSite = status === "published" ? true : ready;
    try {
      await updateWorkspaceContent(ws.id, doc.id, {
        title: title.trim(),
        slug: s,
        intro: intro.trim(),
        subjectId,
        status,
        ready: readyForSite,
        visibility,
        periodYear,
        periodMonth,
        pinned,
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
    window.location.href = "/creator";
  }

  function updateQuestion(index: number, patch: Partial<QuizQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateBlank(qIndex: number, bIndex: number, patch: Partial<BlankAnswer>) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const blanks = q.blanks.map((b, j) => (j === bIndex ? { ...b, ...patch } : b));
        return { ...q, blanks };
      }),
    );
  }

  function removeBlank(qIndex: number, bIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        return { ...q, blanks: q.blanks.filter((_, j) => j !== bIndex) };
      }),
    );
  }

  function removeQuestion(index: number) {
    const q = questions[index];
    const label = q?.label?.trim() || `問${index + 1}`;
    if (!confirm(`「${label}」を削除しますか？`)) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function addQuestion() {
    if (!ws) return;
    void (async () => {
      const usage = checkWorkspaceUsage(ws, "add_question");
      if (!usage.ok) {
        setErr(usage.reason);
        return;
      }
      const n = questions.length + 1;
      const label = nextQuizQuestionLabel(questions[questions.length - 1]?.label);
      const number = quizQuestionNumberFromLabel(label, n);
      const defaultText = DEFAULT_QUIZ_QUESTION_BODY;
      setQuestions((prev) => [
        ...prev,
        {
          id: `q${String(n).padStart(2, "0")}`,
          number,
          label,
          blocks: [{ kind: "paragraph", text: defaultText }],
          template: defaultText,
          blanks: [
            {
              marker: defaultQuizBlankMarker(prev.length),
              answers: DEFAULT_QUIZ_BLANK_ANSWERS,
            },
          ],
        },
      ]);
    })();
  }

  if (!id) {
    return (
      <CreatorShell>
        <p className="admin-msg admin-msg--error">id がありません。</p>
      </CreatorShell>
    );
  }

  return (
    <CreatorShell>
      <h2 className="shell-page-heading">{doc ? `編集: ${doc.title}` : "編集"}</h2>
      {loading ? <p className="admin-loading">読み込み中…</p> : null}
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}
      {msg ? <p className="admin-msg admin-msg--ok">{msg}</p> : null}

      {doc && ws ? (
        <>
          {showAds ? (
            <AdSenseUnit slotKey="creator_edit" className="adsense-unit--creator" />
          ) : null}
          <section className="admin-card">
            <h2>基本情報</h2>
            <div className="admin-field">
              <label htmlFor="title">タイトル</label>
              <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="admin-row">
              <div className="admin-field" style={{ flex: "1 1 10rem" }}>
                <label htmlFor="slug">slug</label>
                <input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
              <div className="admin-field" style={{ flex: "1 1 10rem" }}>
                <label htmlFor="subject">教科</label>
                <select
                  id="subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <ContentPeriodFields
              year={periodYear}
              month={periodMonth}
              onYearChange={setPeriodYear}
              onMonthChange={setPeriodMonth}
            />
            <ContentPinnedField checked={pinned} onChange={setPinned} />
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
                        onChange={(e) => updateQuestion(qi, { label: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      onClick={() => removeQuestion(qi)}
                      disabled={questions.length <= 1}
                    >
                      問題を削除
                    </button>
                  </div>
                  <QuizQuestionBodyEditor
                    contentId={doc.id}
                    workspaceId={ws.id}
                    workspace={ws}
                    blocks={q.blocks ?? [{ kind: "paragraph", text: q.template }]}
                    onChange={(blocks, template) => updateQuestion(qi, { blocks, template })}
                  />
                  <div className="admin-quiz-answers">
                    <h3 className="admin-quiz-answers__heading">答えの登録</h3>
                    <p className="admin-field-hint admin-quiz-answers__hint">
                      本文に入れた空欄記号（① など）と同じ記号で答えを書きます。別解は半角カンマ区切り。読点「、」は答えの本文に使えます。
                    </p>
                    {q.blanks.map((b, bi) => (
                      <div key={`${q.id}-blank-${bi}`} className="admin-blank-row">
                        <div className="admin-blank-marker">
                          <label htmlFor={`blank-${q.id}-${bi}-marker`}>空欄記号</label>
                          <input
                            id={`blank-${q.id}-${bi}-marker`}
                            value={b.marker}
                            onChange={(e) => updateBlank(qi, bi, { marker: e.target.value })}
                          />
                        </div>
                        <div className="admin-blank-answer">
                          <RichTextArea
                            id={`blank-${q.id}-${bi}-answers`}
                            label="答え"
                            value={blankAnswersToInput(b.answers)}
                            onChange={(v) =>
                              updateBlank(qi, bi, { answers: parseBlankAnswersInput(v) })
                            }
                            rows={2}
                            resizable
                            showPreview={false}
                            showHint={false}
                            previewClass="answer-rich"
                          />
                        </div>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-btn--compact admin-blank-delete"
                          onClick={() => removeBlank(qi, bi)}
                          aria-label={`答え ${b.marker || bi + 1} を削除`}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                    {q.blanks.length === 0 ? (
                      <p className="admin-field-hint admin-quiz-answers__empty">
                        答えの登録はありません（「はじめに」など、読むだけの導入に使えます）。
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() =>
                        updateQuestion(qi, {
                          blanks: [
                            ...q.blanks,
                            {
                              marker: defaultQuizBlankMarker(q.blanks.length),
                              answers: DEFAULT_QUIZ_BLANK_ANSWERS,
                            },
                          ],
                        })
                      }
                    >
                      ＋ 答えを追加
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" className="admin-btn" onClick={() => addQuestion()}>
                ＋ 問題を追加
              </button>
            </section>
          ) : (
            <section className="admin-card">
              <h2>レッスン（{sections.length}セクション）</h2>
              <LessonSectionsEditor
                contentId={doc.id}
                workspaceId={ws.id}
                workspace={ws}
                sections={sections}
                onChange={setSections}
              />
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
            <Link href="/creator" className="admin-link">
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
