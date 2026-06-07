"use client";

import { useEffect, useState } from "react";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { listMembersForWorkspace } from "@/lib/workspaces/members";
import { getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { absoluteSiteUrl } from "@/lib/site-url";
import type { WorkspaceMemberDoc } from "@/lib/workspaces/types";

export default function CreatorLearnersPage() {
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        try {
          const workspace = await getWorkspaceByOwner(user.uid);
          setWs(workspace);
          if (workspace) {
            setMembers(await listMembersForWorkspace(workspace.id));
          }
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <CreatorShell>
        <p className="admin-loading">読み込み中…</p>
      </CreatorShell>
    );
  }

  return (
    <CreatorShell>
      <h2 className="shell-page-heading">参加者</h2>
      {ws ? (
        <section className="admin-card">
          <h3 className="admin-card__heading">招待コード</h3>
          <p className="admin-invite-code admin-invite-code--large">{ws.inviteCode}</p>
          <p className="admin-msg" style={{ marginTop: "0.75rem" }}>
            学習者登録ページ:{" "}
            <a href={absoluteSiteUrl("/signup/learner")} target="_blank" rel="noreferrer">
              {absoluteSiteUrl("/signup/learner")}
            </a>
            <br />
            上記で招待コードを入力して参加します。公開を「リンク共有」にした教材はログインなしでも学習できます。
          </p>
          <h3 className="admin-card__heading" style={{ marginTop: "1.25rem" }}>
            教材に参加している人（{members.length}）
          </h3>
          {members.length === 0 ? (
            <p className="admin-msg">
              まだ参加している人はいません。招待コードを共有して、教材への参加を促しましょう。
            </p>
          ) : (
            <ul className="admin-list">
              {members.map((m) => (
                <li key={m.id} className="admin-list-item">
                  <span>参加者（{m.userId.slice(0, 8)}…）</span>
                  <span>{new Date(m.createdAt).toLocaleDateString("ja-JP")} 参加</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </CreatorShell>
  );
}
