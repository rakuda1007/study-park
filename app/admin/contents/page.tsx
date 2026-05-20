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
import {
  ensureLegacyContentsFromManifest,
  listLegacyContents,
  moveMenuEntryInSubject,
  type MenuEntryRef,
} from "@/lib/content/legacy-contents";
import type { ContentDoc, ContentType, LegacyContentDoc, SubjectDoc } from "@/lib/content/types";
import { SLUG_PATTERN } from "@/lib/content/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import contentManifestBase from "@/public/content-manifest.json";
import type { ContentManifest } from "@/lib/content/types";

type AdminMenuRow =
  | { kind: "content"; doc: ContentDoc }
  | { kind: "legacy"; doc: LegacyContentDoc };

function rowKey(row: AdminMenuRow): string {
  return `${row.kind}:${row.doc.id}`;
}

export default function AdminContentsPage() {
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [contents, setContents] = useState<ContentDoc[]>([]);
  const [legacyContents, setLegacyContents] = useState<LegacyContentDoc[]>([]);
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [newType, setNewType] = useState<ContentType>("quiz");
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("math");
  const [creating, setCreating] = useState(false);
  const [reorderingKey, setReorderingKey] = useState<string | null>(null);

  const reload = useCallback(async () => {
    await ensureDefaultSubjects();
    await ensureLegacyContentsFromManifest(contentManifestBase as ContentManifest);
    const [s, c, l] = await Promise.all([
      listSubjects(),
      listContents(),
      listLegacyContents(),
    ]);
    setSubjects(s);
    setContents(c);
    setLegacyContents(l);
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

  const totalCount = contents.length + legacyContents.length;

  const groupedRows = subjects
    .map((subject) => {
      const rows: AdminMenuRow[] = [
        ...contents
          .filter((c) => c.subjectId === subject.id)
          .map((doc) => ({ kind: "content" as const, doc })),
        ...legacyContents
          .filter((l) => l.subjectId === subject.id)
          .map((doc) => ({ kind: "legacy" as const, doc })),
      ].sort((a, b) => a.doc.order - b.doc.order);
      return { subject, rows };
    })
    .filter((g) => g.rows.length > 0);

  async function onReorder(
    subjectId: string,
    ref: MenuEntryRef,
    action: "up" | "down" | "top",
  ) {
    if (!uid) {
      setErr("ログイン情報がありません。");
      return;
    }
    setErr("");
    setMsg("");
    setReorderingKey(`${ref.kind}:${ref.id}`);
    try {
      await moveMenuEntryInSubject(subjectId, ref, action, uid);
      await reload();
      setMsg("並び順を更新しました。");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "並び替えに失敗しました。");
    } finally {
      setReorderingKey(null);
    }
  }

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
        <h2>一覧（{totalCount}件）</h2>
        <p className="admin-hint">
          トップに出るコンテンツを教科ごとに並べ替えできます。初回表示時に、これまで
          content-manifest.json にあった静的アプリ（県庁所在地・雪の多い地域など）を自動登録します。
          静的アプリの問題文・HTML は public フォルダ内のファイルを編集してください。
        </p>
        {groupedRows.length === 0 ? (
          <p className="admin-hint">コンテンツがまだありません。</p>
        ) : (
          groupedRows.map(({ subject, rows }) => (
            <div key={subject.id} className="admin-subject-group">
              <h3>{subject.name}</h3>
              <ul className="admin-list">
                {rows.map((row, index) => {
                  const key = rowKey(row);
                  const busy = reorderingKey === key;
                  const isFirst = index === 0;
                  const isLast = index === rows.length - 1;
                  const ref: MenuEntryRef = { kind: row.kind, id: row.doc.id };

                  const title =
                    row.kind === "content" ? row.doc.title : row.doc.label;
                  const meta =
                    row.kind === "content"
                      ? `${row.doc.type} · /play?slug=${row.doc.slug} · 順序 ${index + 1}`
                      : `静的アプリ · ${row.doc.href} · 順序 ${index + 1}`;

                  const badge =
                    row.kind === "legacy" ? (
                      <span className="admin-badge admin-badge--legacy">静的</span>
                    ) : (
                      <span
                        className={`admin-badge ${
                          row.doc.status === "published" && row.doc.ready
                            ? "admin-badge--published"
                            : row.doc.status === "published"
                              ? "admin-badge--pending"
                              : ""
                        }`}
                      >
                        {row.doc.status === "published" ? "サイト公開中" : row.doc.status}
                      </span>
                    );

                  const mainLink =
                    row.kind === "content" ? (
                      <Link
                        href={`/admin/contents/edit?id=${encodeURIComponent(row.doc.id)}`}
                        className="admin-list-item__link"
                      >
                        <span>
                          {title}
                          <br />
                          <small style={{ color: "var(--admin-muted)" }}>{meta}</small>
                        </span>
                        {badge}
                      </Link>
                    ) : (
                      <a
                        href={row.doc.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-list-item__link"
                      >
                        <span>
                          {title}
                          <br />
                          <small style={{ color: "var(--admin-muted)" }}>{meta}</small>
                        </span>
                        {badge}
                      </a>
                    );

                  return (
                    <li key={key}>
                      <div className="admin-list-item">
                        <div className="admin-list-order" aria-label="並び替え">
                          <button
                            type="button"
                            className="admin-btn admin-btn--compact"
                            title="いちばん上へ"
                            disabled={busy || isFirst}
                            onClick={() => void onReorder(subject.id, ref, "top")}
                          >
                            ⤒
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--compact"
                            title="上へ"
                            disabled={busy || isFirst}
                            onClick={() => void onReorder(subject.id, ref, "up")}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--compact"
                            title="下へ"
                            disabled={busy || isLast}
                            onClick={() => void onReorder(subject.id, ref, "down")}
                          >
                            ↓
                          </button>
                        </div>
                        {mainLink}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </section>
    </AdminShell>
  );
}
