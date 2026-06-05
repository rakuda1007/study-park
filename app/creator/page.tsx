"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { formatBytes, usagePercent } from "@/lib/billing/usage";
import { listBillingTiers } from "@/lib/billing/tiers";
import type { BillingTierDoc } from "@/lib/billing/types";
import { getUserProfile } from "@/lib/users/firestore";
import { getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";
import { subscribeAuth } from "@/lib/firebase/auth-client";

export default function CreatorDashboardPage() {
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<string>("none");
  const [tiers, setTiers] = useState<BillingTierDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        try {
          const [profile, workspace, tierList] = await Promise.all([
            getUserProfile(user.uid),
            getWorkspaceByOwner(user.uid),
            listBillingTiers(),
          ]);
          setPurchaseStatus(profile?.appPurchase.status ?? "none");
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
    return (
      <CreatorShell title="ダッシュボード">
        <p className="admin-loading">読み込み中…</p>
      </CreatorShell>
    );
  }

  if (!ws) {
    return (
      <CreatorShell title="ダッシュボード">
        <p className="admin-msg admin-msg--error">
          ワークスペースがありません。一度ログアウトし、クリエイター登録からやり直してください。
        </p>
      </CreatorShell>
    );
  }

  const storagePct = usagePercent(ws.storageBytesUsed, ws.storageBytesLimit);
  const questionPct = usagePercent(ws.questionCount, ws.questionCountLimit);
  const currentTier = tiers.find((t) => t.id === ws.planId);

  return (
    <CreatorShell title="ダッシュボード">
      <section className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem" }}>{ws.name}</h2>
        <p style={{ fontSize: "0.9rem", color: "var(--admin-muted)" }}>
          URL ID: <code>{ws.slug}</code> · 招待コード:{" "}
          <strong style={{ letterSpacing: "0.12em" }}>{ws.inviteCode}</strong>
        </p>
      </section>

      <section className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>無料枠での作成</h2>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          無料枠の範囲内で教材の作成・公開ができます。上限を超えると上位プラン（月額）への変更が必要です。
          {ws.planId === "included" ? " 無料枠では広告が表示されます。" : ""}
        </p>
        {purchaseStatus === "active" ? (
          <p className="admin-msg" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
            クリエイター版（買い切り）: 購入済み
          </p>
        ) : null}
      </section>

      <section className="admin-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>利用状況</h2>
        <p style={{ margin: "0.25rem 0" }}>
          プラン: <strong>{currentTier?.displayName ?? ws.planId}</strong>（
          {ws.subscriptionStatus === "active" ? "サブスク有効" : "サブスクなし"}）
        </p>
        <p style={{ margin: "0.25rem 0" }}>
          ストレージ: {formatBytes(ws.storageBytesUsed)} / {formatBytes(ws.storageBytesLimit)}（
          {storagePct}%）
        </p>
        <div
          style={{
            height: 8,
            background: "#e8eaf5",
            borderRadius: 4,
            marginBottom: "0.75rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${storagePct}%`,
              height: "100%",
              background: storagePct >= 90 ? "#dc2626" : "#5058b8",
            }}
          />
        </div>
        <p style={{ margin: "0.25rem 0" }}>
          登録問題数: {ws.questionCount} / {ws.questionCountLimit} 問（{questionPct}%）
        </p>
        <div
          style={{
            height: 8,
            background: "#e8eaf5",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${questionPct}%`,
              height: "100%",
              background: questionPct >= 90 ? "#dc2626" : "#5058b8",
            }}
          />
        </div>
        <p className="admin-msg" style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
          上限超過時は新規問題・画像追加をブロックします。月額プランは Stripe の Price ID を
          Firestore <code>billingTiers</code> に設定して接続します。
        </p>
      </section>

      <section className="admin-card">
        <h2 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>プラン一覧（上限は可変）</h2>
        <table className="admin-table" style={{ width: "100%", fontSize: "0.88rem" }}>
          <thead>
            <tr>
              <th>ティア</th>
              <th>ストレージ</th>
              <th>問題数</th>
              <th>Stripe</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr key={t.id}>
                <td>{t.displayName}</td>
                <td>{formatBytes(t.storageBytesLimit)}</td>
                <td>{t.questionCountLimit} 問</td>
                <td>{t.stripePriceId ? "設定済" : "未設定"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p style={{ marginTop: "1rem" }}>
        <Link href="/creator/contents" className="admin-btn admin-btn--primary">
          教材を編集する
        </Link>
      </p>
    </CreatorShell>
  );
}
