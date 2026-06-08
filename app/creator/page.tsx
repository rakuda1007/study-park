"use client";

import { useEffect, useState } from "react";
import { CreatorBillingBanner } from "@/components/creator/CreatorBillingBanner";
import { CreatorContentsSection } from "@/components/creator/CreatorContentsSection";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { refreshWorkspaceUsageSnapshot } from "@/lib/billing/refresh-usage";
import { syncCreatorBillingState } from "@/lib/billing/starter";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { getUserProfile } from "@/lib/users/firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";

export default function CreatorDashboardPage() {
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        try {
          const profile = await getUserProfile(user.uid);
          setPurchaseStatus(profile?.appPurchase.status ?? "none");
          let workspace = await syncCreatorBillingState(user.uid);
          if (workspace) {
            workspace = (await refreshWorkspaceUsageSnapshot(workspace.id)) ?? workspace;
          }
          setWs(workspace);
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
      <CreatorBillingBanner ws={ws} purchaseStatus={purchaseStatus} />

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
