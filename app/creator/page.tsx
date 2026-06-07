"use client";

import { useEffect, useState } from "react";
import { CreatorContentsSection } from "@/components/creator/CreatorContentsSection";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";

export default function CreatorDashboardPage() {
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        try {
          setWs(await getWorkspaceByOwner(user.uid));
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

  if (!ws) {
    return (
      <CreatorShell>
        <p className="admin-msg admin-msg--error">
          ワークスペースがありません。一度ログアウトし、クリエイター登録からやり直してください。
        </p>
      </CreatorShell>
    );
  }

  return (
    <CreatorShell>
      <section className="admin-card">
        <h2 className="admin-card__heading">{ws.name}</h2>
        <p className="admin-card__meta">
          URL ID: <code>{ws.slug}</code> · 招待コード:{" "}
          <strong className="admin-invite-code">{ws.inviteCode}</strong>
        </p>
      </section>

      <CreatorContentsSection />
    </CreatorShell>
  );
}
