"use client";

import { useEffect, useState } from "react";
import { CreatorBillingBanner } from "@/components/creator/CreatorBillingBanner";
import { CreatorContentsSection } from "@/components/creator/CreatorContentsSection";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { refreshWorkspaceUsageSnapshot } from "@/lib/billing/refresh-usage";
import { syncCreatorBillingState } from "@/lib/billing/starter";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { getUserProfile } from "@/lib/users/firestore";
import { getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";

export default function CreatorDashboardPage() {
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [wsMissing, setWsMissing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState("none");

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;

        const [profile, workspace] = await Promise.all([
          getUserProfile(user.uid),
          getWorkspaceByOwner(user.uid),
        ]);

        setPurchaseStatus(profile?.appPurchase.status ?? "none");

        if (!workspace) {
          setWsMissing(true);
          setWs(null);
          return;
        }

        setWsMissing(false);
        setWs(workspace);

        void (async () => {
          try {
            let updated = await syncCreatorBillingState(user.uid);
            if (updated) {
              updated = (await refreshWorkspaceUsageSnapshot(updated.id)) ?? updated;
            }
            if (updated) setWs(updated);
          } catch {
            /* 表示用の初期 WS は既にある */
          }
        })();
      })();
    });
    return unsub;
  }, []);

  return (
    <CreatorShell>
      <h2 className="shell-page-heading">教材</h2>

      {wsMissing ? (
        <p className="admin-msg admin-msg--error">
          ワークスペースがありません。一度ログアウトし、クリエイター登録からやり直してください。
        </p>
      ) : ws ? (
        <>
          <CreatorBillingBanner ws={ws} purchaseStatus={purchaseStatus} />
          <CreatorContentsSection workspace={ws} />
        </>
      ) : (
        <CreatorContentsSection workspace={null} />
      )}
    </CreatorShell>
  );
}
