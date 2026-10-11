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
import { CreatorContentPublishFields } from "@/components/creator/CreatorContentPublishFields";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { shouldShowAdsForPlan } from "@/lib/ads/visibility";
import { getWorkspaceShowAds } from "@/lib/workspaces/ad-flags";
import { refreshWorkspaceUsageSnapshot } from "@/lib/billing/refresh-usage";
import { syncCreatorBillingState } from "@/lib/billing/starter";
import { checkWorkspaceUsage } from "@/lib/billing/usage";
import {
  DEFAULT_QUIZ_QUESTION_BODY,
  nextQuizQuestionLabel,
  normalizeQuizQuestion,
  prepareQuizQuestionForSave,
  quizQuestionNumberFromLabel,
  syncQuizBlanksFromBodyChange,
} from "@/lib/content/quiz-question";
import { blankAnswersToInput, parseBlankAnswersInput } from "@/lib/content/quiz-answers";
import type { BlankAnswer, LessonSection, QuizQuestion } from "@/lib/content/types";
import {
  contentToPublishMode,
  contentToPublishScope,
  publishFieldsFromMode,
  type CreatorPublishMode,
  type CreatorPublishScope,
} from "@/lib/content/publish-status";
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
import { syncWorkspaceAdFlag } from "@/lib/workspaces/ad-flags";
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
  const [publishMode, setPublishMode] = useState<CreatorPublishMode>("draft");
  const [publishScope, setPublishScope] = useState<CreatorPublishScope>("members");
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
    setPublishMode(contentToPublishMode(c));
    setPublishScope(contentToPublishScope(c));
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
      setErr("スラッグは英小文字・数字・ハイフンのみです。");
      return;
    }
    if (await isWorkspaceSlugTaken(ws.id, s, doc.id)) {
      setErr("このスラッグは既に使われています。");
      return;
    }
    const editCheck = checkWorkspaceUsage(ws, "edit_content");
    if (!editCheck.ok) {
      setErr(editCheck.reason);
      return;
    }
    setSaving(true);
    const { status, ready, visibility } = publishFieldsFromMode(publishMode, publishScope);
    try {
      await updateWorkspaceContent(ws.id, doc.id, {
        title: title.trim(),
        slug: s,
        intro: intro.trim(),
        subjectId,
        status,
        ready,
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

  function updateQuestionBody(
    index: number,
    blocks: QuizQuestion["blocks"],
    template: string,
  ) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q;
        return {
          ...q,
          blocks,
          template,
          blanks: syncQuizBlanksFromBodyChange(q.blanks, q.template, template),
        };
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
          blanks: [],
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
      <h2 className="shell-page-heading">教材を編集</h2>
      {loading ? <p className="admin-loading">読み込み中…</p> : null}
      {!doc && err ? <p className="admin-msg admin-msg--error">{err}</p> : null}

      {doc && ws ? (
        <>
          <div className="creator-edit-savebar">
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={saving}
              onClick={() => void onSave()}
            >
              {saving ? "保存中…" : "保存"}
            </button>
            <Link href="/creator" className="admin-link">
              一覧へ
            </Link>
            {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}
            {msg ? <p className="admin-msg admin-msg--ok">{msg}</p> : null}
          </div>

          {showAds ? (
            <AdSenseUnit slotKey="creator_edit" className="adsense-unit--creator" />
          ) : null}

          <div className="admin-field">
            <label htmlFor="title">タイトル</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {doc.type === "quiz" ? (
            <section className="admin-card">
              <h2>問題（{questions.length}問）</h2>
              {questions.map((q, qi) => (
                <div key={q.id} className="admin-question">
                  <div className="creator-question-head">
                    <p className="creator-question-label">{q.label.trim() || `問${qi + 1}`}</p>
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      onClick={() => removeQuestion(qi)}
                      disabled={questions.length <= 1}
                    >
                      問題を削除
                    </button>
                  </div>
                  <details className="creator-question-details">
                    <summary>ラベルを変える</summary>
                    <div className="admin-field">
                      <label htmlFor={`question-label-${q.id}`}>ラベル</label>
                      <input
                        id={`question-label-${q.id}`}
                        value={q.label}
                        onChange={(e) => updateQuestion(qi, { label: e.target.value })}
                      />
                    </div>
                  </details>
                  <QuizQuestionBodyEditor
                    contentId={doc.id}
                    workspaceId={ws.id}
                    workspace={ws}
                    blocks={q.blocks ?? [{ kind: "paragraph", text: q.template }]}
                    hint="空欄はツールバーの「空欄を挿入」から入れます。入れた記号の答え欄が下に足されます。"
                    onChange={(blocks, template) => updateQuestionBody(qi, blocks, template)}
                  />
                  <div className="admin-quiz-answers">
                    <h3 className="admin-quiz-answers__heading">答え</h3>
                    <p className="admin-field-hint admin-quiz-answers__hint">
                      別解はカンマ（,）で並べられます。
                    </p>
                    {q.blanks.map((b, bi) => (
                      <div
                        key={`${q.id}-blank-${b.marker}-${bi}`}
                        className="admin-blank-row creator-blank-row"
                      >
                        <p className="creator-blank-marker">{b.marker}</p>
                        <div className="admin-blank-answer">
                          <RichTextArea
                            id={`blank-${q.id}-${bi}-answers`}
                            label={`答え（${b.marker}）`}
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
                      </div>
                    ))}
                    {q.blanks.length === 0 ? (
                      <p className="admin-field-hint admin-quiz-answers__empty">
                        本文に空欄を入れると、ここに答え欄が足されます。空欄のない問題は、読むだけの導入に使えます。
                      </p>
                    ) : null}
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

          <section className="admin-card">
            <CreatorContentPublishFields
              publishMode={publishMode}
              publishScope={publishScope}
              onPublishModeChange={setPublishMode}
              onPublishScopeChange={setPublishScope}
              workspaceSlug={ws.slug}
              workspaceId={ws.id}
              contentId={doc.id}
              contentSlug={slug}
            />
          </section>

          <details className="creator-content-details">
            <summary>詳細</summary>
            <div className="admin-field">
              <label htmlFor="slug">スラッグ</label>
              <input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <p className="admin-field-hint">URL に使います。英小文字・数字・ハイフンです。</p>
            </div>
            <div className="admin-field">
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
            <ContentPeriodFields
              year={periodYear}
              month={periodMonth}
              onYearChange={setPeriodYear}
              onMonthChange={setPeriodMonth}
            />
            <ContentPinnedField checked={pinned} onChange={setPinned} />
            <label className="admin-checkbox-field">
              <input
                type="checkbox"
                checked={publishMode === "archived"}
                onChange={(e) => setPublishMode(e.target.checked ? "archived" : "draft")}
              />
              <span>アーカイブ</span>
            </label>
            <div className="admin-row">
              <button type="button" className="admin-btn admin-btn--danger" onClick={() => void onDelete()}>
                削除
              </button>
            </div>
          </details>
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
