"use client";

import Link from "next/link";
import { getWorkspaceAccessState } from "@/lib/billing/workspace-access";
import { isStripeConfigured, stripeNotReadyMessage } from "@/lib/billing/stripe";
import type { WorkspaceDoc } from "@/lib/workspaces/types";

type Props = {
  ws: WorkspaceDoc;
  purchaseStatus: string;
};

export function CreatorBillingBanner({ ws, purchaseStatus }: Props) {
  const access = getWorkspaceAccessState(ws);
  const stripeReady = isStripeConfigured();

  if (access.trialPhase === "deletion_due") {
    return (
      <section className="admin-card admin-card--warn" role="alert">
        <h2 className="admin-card__heading">データ削除予定</h2>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          お試し期間と猶予期間が終了しました。スターター（¥980）に登録しない場合、ワークスペースは削除されます。
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
          <Link href="/creator/usage">利用状況・プラン</Link>
        </p>
      </section>
    );
  }

  if (access.trialPhase === "grace") {
    return (
      <section className="admin-card admin-card--warn" role="alert">
        <h2 className="admin-card__heading">お試し期間が終了しました</h2>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          編集・新規追加はできません。スターター（¥980）に登録すると継続利用できます。
          {access.graceDaysRemaining != null
            ? ` データ削除まで残り約 ${access.graceDaysRemaining} 日です。`
            : null}
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
          <Link href="/creator/usage">スターターについて</Link>
        </p>
      </section>
    );
  }

  if (purchaseStatus !== "active" && access.trialDaysRemaining != null && access.trialDaysRemaining <= 30) {
    return (
      <section className="admin-card">
        <h2 className="admin-card__heading">お試し期間のお知らせ</h2>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          お試し残り約 <strong>{access.trialDaysRemaining} 日</strong>です。スターター（¥980）で期限なく
          200問・100MBまで利用できます。
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
          <Link href="/creator/usage">プランを見る</Link>
        </p>
      </section>
    );
  }

  if (purchaseStatus !== "active" && ws.planId === "trial") {
    return (
      <section className="admin-card">
        <h2 className="admin-card__heading">お試し利用中</h2>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          80問・100MBまで無料でお試しできます（最長2年）。
          {access.trialDaysRemaining != null
            ? ` 残り約 ${access.trialDaysRemaining} 日。`
            : null}
          {!stripeReady ? (
            <> {stripeNotReadyMessage("starter_purchase")}</>
          ) : (
            <> スターター（¥980）は<Link href="/creator/usage">利用状況</Link>から購入できます。</>
          )}
        </p>
      </section>
    );
  }

  if (access.isAtUsageWarning) {
    return (
      <section className="admin-card admin-card--warn">
        <h2 className="admin-card__heading">上限に近づいています</h2>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          ストレージまたは問題数が 80% を超えました。上限到達前に{" "}
          <Link href="/creator/usage">プランの確認</Link> をおすすめします。
        </p>
      </section>
    );
  }

  return null;
}
