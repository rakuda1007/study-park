"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { listPublicSubjects } from "@/lib/content/public-firestore";
import type { ContentManifest } from "@/lib/content/types";
import { absoluteSiteUrl } from "@/lib/site-url";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { listWorkspaceContents } from "@/lib/workspaces/content-firestore";
import {
  ensureInvitationSetup,
  getAdminInvitationWorkspace,
  migrateAdminContentsToWorkspace,
} from "@/lib/workspaces/invitation-setup";
import { listMembersForWorkspace } from "@/lib/workspaces/members";
import {
  listWorkspaceSubjects,
  setWorkspaceSubjectStatus,
  syncWorkspaceSubjectsFromContents,
} from "@/lib/workspaces/subjects-firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";
import type { WorkspaceMemberDoc } from "@/lib/workspaces/types";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import type { WorkspaceSubjectDoc } from "@/lib/workspaces/types";
import { isValidWorkspaceSlug, normalizeWorkspaceSlug } from "@/lib/workspaces/slug";
import contentManifest from "@/public/content-manifest.json";

export default function AdminInvitationsPage() {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberDoc[]>([]);
  const [wsContents, setWsContents] = useState<WorkspaceContentDoc[]>([]);
  const [wsSubjects, setWsSubjects] = useState<WorkspaceSubjectDoc[]>([]);
  const manifest = contentManifest as ContentManifest;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [wsName, setWsName] = useState("Study Park 教材");
  const [wsSlug, setWsSlug] = useState("study-park");

  const reload = useCallback(async (ownerId: string) => {
    const workspace = await getAdminInvitationWorkspace(ownerId);
    setWs(workspace);
    if (workspace) {
      const [m, c, publicSubjects] = await Promise.all([
        listMembersForWorkspace(workspace.id),
        listWorkspaceContents(workspace.id),
        listPublicSubjects(),
      ]);
      await syncWorkspaceSubjectsFromContents(workspace.id, manifest, publicSubjects);
      const subjects = await listWorkspaceSubjects(workspace.id);
      setMembers(m);
      setWsContents(c);
      setWsSubjects(subjects);
    } else {
      setMembers([]);
      setWsContents([]);
      setWsSubjects([]);
    }
  }, [manifest]);

  const contentCountBySubject = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of wsContents) {
      map.set(c.subjectId, (map.get(c.subjectId) ?? 0) + 1);
    }
    return map;
  }, [wsContents]);

  const publishedSubjectCount = wsSubjects.filter((s) => s.status === "published").length;

  async function toggleSubjectPublish(subject: WorkspaceSubjectDoc) {
    if (!ws) return;
    const next = subject.status === "published" ? "draft" : "published";
    setBusy(true);
    setErr("");
    try {
      await setWorkspaceSubjectStatus(ws.id, subject.id, next);
      setMsg(
        next === "published"
          ? `「${subject.name}」を学習者に公開しました。`
          : `「${subject.name}」を非公開にしました。`,
      );
      await reload(uid);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "公開設定の更新に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setUid(user?.uid ?? "");
      setEmail(user?.email ?? "");
      if (!user) {
        setLoading(false);
        return;
      }
      void (async () => {
        try {
          await reload(user.uid);
        } catch (e) {
          setErr(e instanceof Error ? e.message : "読み込みに失敗しました。");
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [reload]);

  async function onSetup(e: FormEvent) {
    e.preventDefault();
    if (!uid || !email) return;
    setBusy(true);
    setErr("");
    setMsg("");
    const slug = normalizeWorkspaceSlug(wsSlug);
    if (!isValidWorkspaceSlug(slug)) {
      setErr("URL ID は英小文字・数字・ハイフン（2〜40文字）です。");
      setBusy(false);
      return;
    }
    try {
      const workspace = await ensureInvitationSetup(uid, email, {
        workspaceName: wsName.trim() || "Study Park 教材",
        workspaceSlug: slug,
      });
      setWs(workspace);
      setMsg("学習者招待の準備ができました。次に教材を移行してください。");
      await reload(uid);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "準備に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function onMigrate() {
    if (!uid || !ws) return;
    if (
      !confirm(
        "管理用の教材をワークスペースへコピーします。元の公開教材は下書きに戻します（重複公開を防ぐため）。よろしいですか？",
      )
    ) {
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const result = await migrateAdminContentsToWorkspace(ws.id, uid, {
        archiveOriginal: true,
        visibility: "members",
      });
      setMsg(
        `移行しました。追加 ${result.copied} 件、更新 ${result.updated} 件、元を下書きに ${result.archived} 件。`,
      );
      await reload(uid);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "移行に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  const learnerSignupUrl = absoluteSiteUrl("/signup/learner");

  return (
    <AdminShell title="学習者招待">
      {loading ? <p className="admin-loading">読み込み中…</p> : null}
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}
      {msg ? <p className="admin-msg admin-msg--ok">{msg}</p> : null}

      <section className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.5rem" }}>流れ</h2>
        <ol style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
          <li>下の「準備」でワークスペースと招待コードを作る</li>
          <li>「教材を移行」で /admin の教材を招待対応版へコピーする</li>
          <li>学習者に招待コードと <a href="/signup/learner">学習者登録</a> の URL を伝える</li>
          <li>科目ごとに公開を設定し、学習者は <a href="/learner">学習者ホーム</a> から学習する</li>
        </ol>
      </section>

      {!ws ? (
        <section className="admin-card">
          <h2 style={{ fontSize: "1.05rem" }}>1. 招待の準備</h2>
          <p className="admin-msg" style={{ marginBottom: "0.75rem" }}>
            まだワークスペースがありません。教室名と URL ID を決めて作成してください。
          </p>
          <form onSubmit={(e) => void onSetup(e)}>
            <div className="admin-field">
              <label htmlFor="wsName">ワークスペース名</label>
              <input
                id="wsName"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="wsSlug">URL ID（学習 URL に使用）</label>
              <input
                id="wsSlug"
                value={wsSlug}
                onChange={(e) => setWsSlug(e.target.value)}
                placeholder="study-park"
                required
              />
            </div>
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={busy || !uid}
            >
              {busy ? "処理中…" : "準備する"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="admin-card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem" }}>招待コード</h2>
            <p style={{ fontSize: "1.75rem", letterSpacing: "0.2em", fontWeight: 700 }}>
              {ws.inviteCode}
            </p>
            <p style={{ fontSize: "0.88rem", color: "var(--admin-muted)", marginTop: "0.5rem" }}>
              ワークスペース: {ws.name}（URL ID: <code>{ws.slug}</code>）
            </p>
            <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
              学習者登録ページ:{" "}
              <a href={learnerSignupUrl} target="_blank" rel="noreferrer">
                {learnerSignupUrl}
              </a>
            </p>
          </section>

          <section className="admin-card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem" }}>2. 教材の移行</h2>
            <p className="admin-msg" style={{ marginBottom: "0.75rem" }}>
              /admin で作った教材をワークスペース（学習者が見る教室用）へコピーします。
              同じ slug が既にある場合は<strong>上書き更新</strong>されます（HTML ブロックの変更もここで反映）。
              「教室用に同期」は本文だけ更新し、教室側の<strong>公開状態は維持</strong>します（管理側が下書きでも学習者から消えません）。
              初回の「移行」では公開中の旧 URL（<code>/play?slug=...</code>）を下書きに戻します。
            </p>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={busy}
              onClick={() => void onMigrate()}
            >
              {busy ? "処理中…" : "教材をワークスペースへ移行"}
            </button>
            <button
              type="button"
              className="admin-btn"
              style={{ marginLeft: "0.5rem" }}
              disabled={busy}
              onClick={() => {
                if (!uid || !ws) return;
                setBusy(true);
                setErr("");
                void migrateAdminContentsToWorkspace(ws.id, uid, {
                  archiveOriginal: false,
                  visibility: "members",
                })
                  .then((result) => {
                    setMsg(
                      `同期しました。追加 ${result.copied} 件、更新 ${result.updated} 件。`,
                    );
                    return reload(uid);
                  })
                  .catch((e) =>
                    setErr(e instanceof Error ? e.message : "同期に失敗しました。"),
                  )
                  .finally(() => setBusy(false));
              }}
            >
              教室用に同期（追加・更新）
            </button>
          </section>

          <section className="admin-card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem" }}>参加済み学習者（{members.length}）</h2>
            {members.length === 0 ? (
              <p className="admin-msg">まだいません。招待コードを伝えて登録してもらってください。</p>
            ) : (
              <ul className="admin-list">
                {members.map((m) => (
                  <li key={m.id} className="admin-list-item">
                    <span>UID: {m.userId}</span>
                    <span>{new Date(m.createdAt).toLocaleDateString("ja-JP")} 参加</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="admin-card">
            <h2 style={{ fontSize: "1.05rem" }}>
              3. 科目ごとの公開（公開中 {publishedSubjectCount} / {wsSubjects.length}）
            </h2>
            <p className="admin-msg" style={{ marginTop: 0, marginBottom: "0.75rem" }}>
              学習者に見せる教材は科目単位で公開します。科目を公開すると、その中の教材が学習者ホームに表示されます。
            </p>
            {wsSubjects.length === 0 ? (
              <p className="admin-msg">教材を移行すると、科目がここに表示されます。</p>
            ) : (
              <ul className="admin-list">
                {wsSubjects.map((s) => {
                  const count = contentCountBySubject.get(s.id) ?? 0;
                  return (
                    <li key={s.id} className="admin-list-item">
                      <span>
                        <strong>{s.name}</strong>
                        <br />
                        <small style={{ color: "var(--admin-muted)" }}>
                          教材 {count} 件
                        </small>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          className={`admin-badge ${
                            s.status === "published" ? "admin-badge--published" : ""
                          }`}
                        >
                          {s.status === "published" ? "公開中" : "非公開"}
                        </span>
                        <button
                          type="button"
                          className="admin-btn"
                          disabled={busy || count === 0}
                          onClick={() => void toggleSubjectPublish(s)}
                        >
                          {s.status === "published" ? "非公開にする" : "公開する"}
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}
