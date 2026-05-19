"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  createContent,
  ensureDefaultSubjects,
  isSlugTaken,
  listContents,
  listSubjects,
} from "@/lib/content/firestore";
import type { ContentDoc, ContentType, SubjectDoc } from "@/lib/content/types";
import { SLUG_PATTERN } from "@/lib/content/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";

export default function AdminContentsPage() {
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [contents, setContents] = useState<ContentDoc[]>([]);
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [newType, setNewType] = useState<ContentType>("quiz");
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("math");
  const [creating, setCreating] = useState(false);

  const reload = useCallback(async () => {
    await ensureDefaultSubjects();
    const [s, c] = await Promise.all([listSubjects(), listContents()]);
    setSubjects(s);
    setContents(c);
    if (s.length && !s.some((x) => x.id === newSubjectId)) {
      setNewSubjectId(s[0].id);
    }
  }, [newSubjectId]);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setUid(user?.uid ?? "");
    });
    return unsub;
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await reload();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    })();
  }, [reload]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const slug = newSlug.trim().toLowerCase();
    if (!SLUG_PATTERN.test(slug)) {
      setErr("slug は英小文字・数字・ハイフンのみ（例: my-quiz）");
      return;
    }
    if (!newTitle.trim()) {
      setErr("タイトルを入力してください。");
      return;
    }
    setCreating(true);
    try {
      if (!uid) throw new Error("ログイン情報がありません。");
      if (await isSlugTaken(slug)) {
        setErr("この slug は既に使われています。");
        return;
      }
      const id = await createContent({
        subjectId: newSubjectId,
        type: newType,
        slug,
        title: newTitle.trim(),
        updatedBy: uid,
      });
      setMsg("作成しました。編集画面へ移動します。");
      setNewSlug("");
      setNewTitle("");
      await reload();
      window.location.href = `/admin/contents/edit?id=${encodeURIComponent(id)}`;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "作成に失敗しました。");
    } finally {
      setCreating(false);
    }
  }

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;

  return (
    <AdminShell title="コンテンツ管理">
      {loading ? <p className="admin-loading">読み込み中…</p> : null}
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}
      {msg ? <p className="admin-msg admin-msg--ok">{msg}</p> : null}

      <section className="admin-card">
        <h2>新規作成</h2>
        <form onSubmit={(e) => void onCreate(e)}>
          <div className="admin-row">
            <div className="admin-field" style={{ flex: "1 1 8rem" }}>
              <label htmlFor="newType">種別</label>
              <select
                id="newType"
                value={newType}
                onChange={(e) => setNewType(e.target.value as ContentType)}
              >
                <option value="quiz">クイズ（空欄）</option>
                <option value="lesson">まとめ（レッスン）</option>
              </select>
            </div>
            <div className="admin-field" style={{ flex: "1 1 8rem" }}>
              <label htmlFor="newSubject">教科</label>
              <select
                id="newSubject"
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
          </div>
          <div className="admin-field">
            <label htmlFor="newSlug">slug（URL）</label>
            <input
              id="newSlug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="例: nigata-snow"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="newTitle">タイトル</label>
            <input
              id="newTitle"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>
            {creating ? "作成中…" : "作成して編集"}
          </button>
        </form>
      </section>

      <section className="admin-card">
        <h2>一覧（{contents.length}件）</h2>
        <ul className="admin-list">
          {contents.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/contents/edit?id=${encodeURIComponent(c.id)}`}>
                <span>
                  {c.title}
                  <br />
                  <small style={{ color: "var(--admin-muted)" }}>
                    {subjectName(c.subjectId)} · {c.type} · /{c.slug}/
                  </small>
                </span>
                <span
                  className={`admin-badge ${c.status === "published" ? "admin-badge--published" : ""}`}
                >
                  {c.status}
                  {!c.ready ? " · 未準備" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
