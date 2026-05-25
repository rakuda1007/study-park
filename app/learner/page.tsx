"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { workspacePlayHref } from "@/lib/content/urls";
import { listPublishedContentsForMember } from "@/lib/workspaces/content-firestore";
import { getWorkspace } from "@/lib/workspaces/firestore";
import { listWorkspacesForLearner } from "@/lib/workspaces/members";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import { signOutUser, subscribeAuth } from "@/lib/firebase/auth-client";

type Row = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  contents: WorkspaceContentDoc[];
};

export default function LearnerHomePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        try {
          const memberships = await listWorkspacesForLearner(user.uid);
          const data: Row[] = [];
          for (const m of memberships) {
            const ws = await getWorkspace(m.workspaceId);
            if (!ws) continue;
            const contents = await listPublishedContentsForMember(m.workspaceId);
            data.push({
              workspaceId: m.workspaceId,
              workspaceName: ws.name,
              workspaceSlug: ws.slug,
              contents,
            });
          }
          setRows(data);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, []);

  return (
    <div className="admin-shell" style={{ padding: "1.5rem" }}>
      <header className="admin-header">
        <h1 className="admin-title">学習者ホーム</h1>
        <nav className="admin-nav">
          <Link href="/" className="admin-link">
            Study Park トップ
          </Link>
          <button
            type="button"
            className="admin-btn"
            onClick={() => void signOutUser().then(() => (window.location.href = "/"))}
          >
            ログアウト
          </button>
        </nav>
      </header>

      <p className="admin-msg" style={{ marginBottom: "1rem" }}>
        九九・県庁所在地は <Link href="/">トップページ</Link> から無料で利用できます。
      </p>

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading && rows.length === 0 ? (
        <section className="admin-card">
          <p>参加している教材がありません。</p>
          <p>
            <Link href="/signup/learner">招待コードで参加</Link>
          </p>
        </section>
      ) : null}

      {rows.map((r) => (
        <section key={r.workspaceId} className="admin-card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem" }}>{r.workspaceName}</h2>
          {r.contents.length === 0 ? (
            <p className="admin-msg">公開中の教材はまだありません。</p>
          ) : (
            <ul className="admin-list">
              {r.contents.map((c) => (
                <li key={c.id} className="admin-list-item">
                  <span>
                    {c.title}（{c.type}）
                  </span>
                  <Link
                    href={workspacePlayHref(r.workspaceSlug, c.slug)}
                    className="admin-btn admin-btn--primary"
                  >
                    学習する
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
