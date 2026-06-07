"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { LessonSectionsEditor } from "@/components/admin/LessonSectionsEditor";
import { QuizQuestionBodyEditor } from "@/components/admin/QuizQuestionBodyEditor";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  buildManifest,
  downloadExportZip,
  downloadTextFile,
} from "@/lib/content/export";
import {
  deleteContent,
  getContent,
  isSlugTaken,
  listContents,
  listSubjects,
  saveLessonSections,
  saveQuizQuestions,
  updateContent,
} from "@/lib/content/firestore";
import { defaultQuizBlankMarker } from "@/lib/content/quiz-markers";
import {
  DEFAULT_QUIZ_QUESTION_BODY,
  normalizeQuizQuestion,
  prepareQuizQuestionForSave,
} from "@/lib/content/quiz-question";
import type {
  BlankAnswer,
  ContentDoc,
  ContentStatus,
  LessonSection,
  QuizQuestion,
  SubjectDoc,
} from "@/lib/content/types";
import { SLUG_PATTERN } from "@/lib/content/types";
import { contentPlayHref } from "@/lib/content/urls";
import { listLegacyContents } from "@/lib/content/legacy-contents";
import { ContentPeriodFields } from "@/components/admin/ContentPeriodFields";
import { RichTextArea } from "@/components/admin/RichTextArea";
import {
  blankAnswersToInput,
  DEFAULT_QUIZ_BLANK_ANSWERS,
  parseBlankAnswersInput,
} from "@/lib/content/quiz-answers";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import contentManifestBase from "@/public/content-manifest.json";
import type { ContentManifest } from "@/lib/content/types";

function EditContentInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";

  const [uid, setUid] = useState("");
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [doc, setDoc] = useState<ContentDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [intro, setIntro] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [ready, setReady] = useState(false);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [sections, setSections] = useState<LessonSection[]>([]);

  useEffect(() => {
    const unsub = subscribeAuth((user) => setUid(user?.uid ?? ""));
    return unsub;
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    const [s, c] = await Promise.all([listSubjects(), getContent(id)]);
    setSubjects(s);
    if (!c) {
      setErr("コンテンツが見つかりません。");
      setDoc(null);
      return;
    }
    setDoc(c);
    setTitle(c.title);
    setSlug(c.slug);
    setIntro(c.intro ?? "");
    setSubjectId(c.subjectId);
    setStatus(c.status);
    setReady(c.ready);
    setPeriodYear(c.periodYear);
    setPeriodMonth(c.periodMonth);
    setQuestions((c.quiz?.questions ?? []).map(normalizeQuizQuestion));
    setSections(c.lesson?.sections ?? []);
  }, [id]);

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
    if (!doc || !uid) return;
    setErr("");
    setMsg("");
    const s = slug.trim().toLowerCase();
    if (!SLUG_PATTERN.test(s)) {
      setErr("slug は英小文字・数字・ハイフンのみです。");
      return;
    }
    if (await isSlugTaken(s, doc.id)) {
      setErr("この slug は既に使われています。");
      return;
    }
    setSaving(true);
    const readyForSite = status === "published" ? true : ready;
    try {
      await updateContent(doc.id, {
        title: title.trim(),
        slug: s,
        intro: intro.trim(),
        subjectId,
        status,
        ready: readyForSite,
        periodYear,
        periodMonth,
        updatedBy: uid,
      });
      if (doc.type === "quiz") {
        await saveQuizQuestions(
          doc.id,
          questions.map(prepareQuizQuestionForSave),
          uid,
        );
      } else {
        await saveLessonSections(doc.id, sections, uid);
      }
      const live = status === "published" && readyForSite;
      setMsg(
        live
          ? "保存しました。トップメニューとプレイ画面に反映されます（再読み込みで確認）。"
          : "保存しました。公開するには「公開」＋「メニューに表示」にしてください。",
      );
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function onExport() {
    if (!doc) return;
    const allContents = await listContents();
    const allSubjects = await listSubjects();
    const merged = { ...doc, title: title.trim(), slug, intro, subjectId, status, ready };
    if (merged.type === "quiz") merged.quiz = { quizKind: "blank", questions };
    else merged.lesson = { sections };

    const legacy = await listLegacyContents();
    const manifest = buildManifest(
      allSubjects,
      allContents.map((c) => (c.id === doc.id ? merged : c)),
      legacy,
      contentManifestBase as ContentManifest,
    );
    await downloadExportZip(merged, JSON.stringify(manifest, null, 2));
    setMsg("エクスポート用テキストをダウンロードしました。");
  }

  function onDownloadManifest() {
    void (async () => {
      const allContents = await listContents();
      const allSubjects = await listSubjects();
      const legacy = await listLegacyContents();
      const manifest = buildManifest(
        allSubjects,
        allContents,
        legacy,
        contentManifestBase as ContentManifest,
      );
      downloadTextFile(
        "content-manifest.json",
        JSON.stringify(manifest, null, 2),
        "application/json",
      );
    })();
  }

  async function onDelete() {
    if (!doc || !confirm(`「${doc.title}」を削除しますか？`)) return;
    await deleteContent(doc.id);
    window.location.href = "/admin/contents";
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
        if (i !== qIndex || q.blanks.length <= 1) return q;
        return { ...q, blanks: q.blanks.filter((_, j) => j !== bIndex) };
      }),
    );
  }

  function addQuestion() {
    const n = questions.length + 1;
    const id = `q${String(n).padStart(2, "0")}`;
    const defaultText = DEFAULT_QUIZ_QUESTION_BODY;
    setQuestions((prev) => [
      ...prev,
      {
        id,
        number: n,
        label: `問${n}`,
        blocks: [{ kind: "paragraph", text: defaultText }],
        template: defaultText,
        blanks: [{ marker: defaultQuizBlankMarker(0), answers: DEFAULT_QUIZ_BLANK_ANSWERS }],
      },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  if (!id) {
    return (
      <AdminShell title="編集">
        <p className="admin-msg admin-msg--error">id パラメータがありません。</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={doc ? `編集: ${doc.title}` : "編集"}>
      {loading ? <p className="admin-loading">読み込み中…</p> : null}
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}
      {msg ? <p className="admin-msg admin-msg--ok">{msg}</p> : null}

      {doc ? (
        <>
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
            <RichTextArea
              id="intro"
              label="はじめに / リード文"
              value={intro}
              onChange={setIntro}
              rows={3}
              previewClass="intro-body"
            />
            <div className="admin-row">
              <div className="admin-field" style={{ flex: "1 1 8rem" }}>
                <label htmlFor="status">公開状態</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => {
                    const next = e.target.value as ContentStatus;
                    setStatus(next);
                    if (next === "published") setReady(true);
                  }}
                >
                  <option value="draft">下書き（サイトに出さない）</option>
                  <option value="published">公開（サイトに出す）</option>
                  <option value="archived">アーカイブ</option>
                </select>
              </div>
              <label className="admin-row" style={{ marginTop: "1.5rem" }}>
                <input
                  type="checkbox"
                  checked={ready}
                  onChange={(e) => setReady(e.target.checked)}
                />
                トップメニュー・プレイ画面に表示
              </label>
            </div>
            {status === "published" && !ready ? (
              <p className="admin-msg admin-msg--error" style={{ marginTop: "0.5rem" }}>
                「公開」だけでは本番に出ません。上のチェックをオンにして保存してください。
              </p>
            ) : null}
            <p style={{ fontSize: "0.8rem", color: "var(--admin-muted)" }}>
              種別: {doc.type} · ID: {doc.id}
            </p>
          </section>

          {doc.type === "quiz" ? (
            <section className="admin-card">
              <h2>クイズ問題（{questions.length}問）</h2>
              {questions.map((q, qi) => (
                <div key={q.id} className="admin-question">
                  <div className="admin-row">
                    <div className="admin-field" style={{ flex: "0 0 4rem" }}>
                      <label>番号</label>
                      <input
                        type="number"
                        min={1}
                        value={q.number}
                        onChange={(e) =>
                          updateQuestion(qi, { number: Number(e.target.value) })
                        }
                      />
                    </div>
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
                    >
                      削除
                    </button>
                  </div>
                  {doc ? (
                    <QuizQuestionBodyEditor
                      contentId={doc.id}
                      blocks={q.blocks ?? [{ kind: "paragraph", text: q.template }]}
                      onChange={(blocks, template) =>
                        updateQuestion(qi, { blocks, template })
                      }
                    />
                  ) : null}
                  {q.blanks.map((b, bi) => (
                    <div key={`${q.id}-blank-${bi}`} className="admin-blank-row">
                      <div className="admin-blank-marker">
                        <label htmlFor={`blank-${q.id}-${bi}-marker`}>記号</label>
                        <input
                          id={`blank-${q.id}-${bi}-marker`}
                          value={b.marker}
                          onChange={(e) => updateBlank(qi, bi, { marker: e.target.value })}
                        />
                      </div>
                      <div className="admin-blank-answer">
                        <RichTextArea
                          id={`blank-${q.id}-${bi}-answers`}
                          label="正答（別解はカンマ・読点区切り）"
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
                        disabled={q.blanks.length <= 1}
                        aria-label={`空欄 ${b.marker || bi + 1} を削除`}
                      >
                        削除
                      </button>
                    </div>
                  ))}
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
                    空欄を追加
                  </button>
                </div>
              ))}
              <button type="button" className="admin-btn" onClick={addQuestion}>
                問題を追加
              </button>
            </section>
          ) : (
            <section className="admin-card">
              <h2>レッスン（{sections.length}セクション）</h2>
              <LessonSectionsEditor
                contentId={doc.id}
                sections={sections}
                onChange={setSections}
              />
            </section>
          )}

          <section className="admin-card">
            <h2>公開・操作</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--admin-muted)", margin: "0 0 0.75rem" }}>
              保存後、ステータスを「公開」かつ「メニューに表示」にすると、エクスポートなしでサイトに載ります（URL:{" "}
              <code>{contentPlayHref(slug.trim().toLowerCase() || "your-slug")}</code>）。
            </p>
            <div className="admin-row">
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={saving}
                onClick={() => void onSave()}
              >
                {saving ? "保存中…" : "保存"}
              </button>
              {status === "published" && ready && slug.trim() ? (
                <a
                  href={contentPlayHref(slug.trim().toLowerCase())}
                  className="admin-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  プレビュー
                </a>
              ) : null}
              <button type="button" className="admin-btn admin-btn--danger" onClick={() => void onDelete()}>
                削除
              </button>
            </div>
            <details style={{ marginTop: "1rem" }}>
              <summary style={{ cursor: "pointer", color: "var(--admin-muted)" }}>
                静的ファイル用（上級・オプション）
              </summary>
              <div className="admin-row" style={{ marginTop: "0.5rem" }}>
                <button type="button" className="admin-btn" onClick={() => void onExport()}>
                  エクスポート（txt）
                </button>
                <button type="button" className="admin-btn" onClick={onDownloadManifest}>
                  manifest.json
                </button>
              </div>
            </details>
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}

export default function EditContentPage() {
  return (
    <Suspense fallback={<p className="admin-loading">読み込み中…</p>}>
      <EditContentInner />
    </Suspense>
  );
}
