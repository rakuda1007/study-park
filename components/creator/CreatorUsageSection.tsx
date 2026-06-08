"use client";

import { useEffect, useState } from "react";
import { CreatorBillingBanner } from "@/components/creator/CreatorBillingBanner";
import { refreshWorkspaceUsageSnapshot } from "@/lib/billing/refresh-usage";
import { syncCreatorBillingState } from "@/lib/billing/starter";
import { formatBytes, usagePercent } from "@/lib/billing/usage";
import { listBillingTiers } from "@/lib/billing/tiers";
import { getWorkspaceAccessState } from "@/lib/billing/workspace-access";
import type { BillingTierDoc } from "@/lib/billing/types";
import { getUserProfile } from "@/lib/users/firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";

function formatTrialRemaining(trialEndsAt: string | null): string | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "お試し期間終了";
  if (days === 0) return "お試し残り: 今日まで";
  return `お試し残り: 約 ${days} 日`;
}

function tierPriceLabel(t: BillingTierDoc): string {
  if (t.oneTimePriceLabel) return t.oneTimePriceLabel;
  if (t.monthlyPriceLabel) return `${t.monthlyPriceLabel}/月`;
  return "—";
}

export function CreatorUsageSection() {
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<string>("none");
  const [tiers, setTiers] = useState<BillingTierDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        try {
          const [profile, tierList] = await Promise.all([
            getUserProfile(user.uid),
            listBillingTiers(),
          ]);
          setPurchaseStatus(profile?.appPurchase.status ?? "none");
          let workspace = await syncCreatorBillingState(user.uid);
          if (workspace) {
            workspace = (await refreshWorkspaceUsageSnapshot(workspace.id)) ?? workspace;
          }
          setWs(workspace);
          setTiers(tierList);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, []);

  if (loading) {
    return <p className="admin-loading">読み込み中…</p>;
  }

  if (!ws) {
    return (
      <p className="admin-msg admin-msg--error">
        ワークスペースがありません。一度ログアウトし、クリエイター登録からやり直してください。
      </p>
    );
  }

  const storagePct = usagePercent(ws.storageBytesUsed, ws.storageBytesLimit);
  const questionPct = usagePercent(ws.questionCount, ws.questionCountLimit);
  const currentTier = tiers.find((t) => t.id === ws.planId);
  const trialRemaining = ws.planId === "trial" ? formatTrialRemaining(ws.trialEndsAt) : null;
  const access = getWorkspaceAccessState(ws);

  return (
    <>
      <CreatorBillingBanner ws={ws} purchaseStatus={purchaseStatus} />

      <section className="admin-card">
        <h2 className="admin-card__heading">プラン</h2>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          {ws.planId === "trial" ? (
            <>
              お試し期間中（80問・100MBまで）。スターター（¥980）で期限なく200問・100MBまで利用できます。
              {trialRemaining ? ` ${trialRemaining}。` : ""}
              お試し中は学習画面に広告が表示されます。
            </>
          ) : (
            <>
              スターターまたは月額プランの範囲内で教材の作成・公開ができます。上限を超えると上位プランへの変更が必要です。
            </>
          )}
        </p>
        {purchaseStatus === "active" ? (
          <p className="admin-msg" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
            スターター: 購入済み
          </p>
        ) : ws.planId === "trial" ? (
          <p className="admin-msg" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
            スターター（¥980）未購入
          </p>
        ) : null}
      </section>

      <section className="admin-card">
        <h2 className="admin-card__heading">利用状況</h2>
        <p style={{ margin: "0.25rem 0" }}>
          プラン: <strong>{currentTier?.displayName ?? ws.planId}</strong>（
          {ws.subscriptionStatus === "active" ? "月額契約中" : "月額なし"}）
        </p>
        <p style={{ margin: "0.25rem 0" }}>
          ストレージ: {formatBytes(ws.storageBytesUsed)} / {formatBytes(ws.storageBytesLimit)}（
          {storagePct}%）
        </p>
        <div className="admin-progress">
          <div
            className="admin-progress__bar"
            style={{
              width: `${storagePct}%`,
              background: storagePct >= 90 ? "#dc2626" : "#5058b8",
            }}
          />
        </div>
        <p style={{ margin: "0.25rem 0" }}>
          登録問題数: {ws.questionCount} / {ws.questionCountLimit} 問（{questionPct}%）
        </p>
        <div className="admin-progress">
          <div
            className="admin-progress__bar"
            style={{
              width: `${questionPct}%`,
              background: questionPct >= 90 ? "#dc2626" : "#5058b8",
            }}
          />
        </div>
        {access.trialDaysRemaining != null ? (
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
            お試し残り: 約 {access.trialDaysRemaining} 日
          </p>
        ) : null}
        <p className="admin-msg" style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
          上限超過時は新規問題・画像追加をブロックします。スターター・月額は Stripe の Price ID
          設定後に Checkout を接続します。
        </p>
      </section>

      <section className="admin-card">
        <h2 className="admin-card__heading">プラン一覧</h2>
        <table className="admin-table" style={{ width: "100%", fontSize: "0.88rem" }}>
          <thead>
            <tr>
              <th>プラン</th>
              <th>価格</th>
              <th>ストレージ</th>
              <th>問題数</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr key={t.id}>
                <td>{t.displayName}</td>
                <td>{tierPriceLabel(t)}</td>
                <td>{formatBytes(t.storageBytesLimit)}</td>
                <td>{t.questionCountLimit} 問</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
