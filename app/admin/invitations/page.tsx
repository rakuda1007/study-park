"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { workspacePlayHref } from "@/lib/content/urls";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { listWorkspaceContents } from "@/lib/workspaces/content-firestore";
import {
  ensureInvitationSetup,
  getAdminInvitationWorkspace,
  migrateAdminContentsToWorkspace,
} from "@/lib/workspaces/invitation-setup";
import { listMembersForWorkspace } from "@/lib/workspaces/members";
import type { WorkspaceDoc } from "@/lib/workspaces/types";
import type { WorkspaceMemberDoc } from "@/lib/workspaces/types";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import { isValidWorkspaceSlug, normalizeWorkspaceSlug } from "@/lib/workspaces/slug";

export default function AdminInvitationsPage() {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberDoc[]>([]);
  const [wsContents, setWsContents] = useState<WorkspaceContentDoc[]>([]);
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
      const [m, c] = await Promise.all([
        listMembersForWorkspace(workspace.id),
        listWorkspaceContents(workspace.id),
      ]);
      setMembers(m);
      setWsContents(c.filter((x) => x.status === "published"));
    } else {
      setMembers([]);
      setWsContents([]);
    }
  }, []);

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

  const learnerSignupUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/signup/learner`
      : "/signup/learner";

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
          <li>学習者はログイン後 <a href="/learner">学習者ホーム</a> から学習する</li>
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
            <h2 style={{ fontSize: "1.05rem" }}>招待用の学習 URL（公開中 {wsContents.length}）</h2>
            {wsContents.length === 0 ? (
              <p className="admin-msg">移行後に公開状態の教材がここに表示されます。</p>
            ) : (
              <ul className="admin-list">
                {wsContents.map((c) => (
                  <li key={c.id} className="admin-list-item">
                    <span>
                      {c.title}{" "}
                      <code style={{ fontSize: "0.8rem" }}>
                        {workspacePlayHref(ws.slug, c.slug)}
                      </code>
                    </span>
                    <Link
                      href={workspacePlayHref(ws.slug, c.slug)}
                      className="admin-btn"
                      target="_blank"
                    >
                      開く
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="admin-msg" style={{ marginTop: "0.75rem" }}>
              リンクだけ渡したい場合は編集画面で公開範囲を「リンク共有（unlisted）」に変更できます（
              <Link href="/creator/contents">/creator/contents</Link> から編集）。
            </p>
          </section>
        </>
      )}
    </AdminShell>
  );
}
