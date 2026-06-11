"use client";

import { useState } from "react";
import { startStarterCheckout, startSubscriptionCheckout } from "@/lib/billing/checkout-client";
import { isStripeConfigured } from "@/lib/billing/stripe";
import type { BillingTierDoc } from "@/lib/billing/types";
import type { WorkspaceDoc } from "@/lib/workspaces/types";

type Props = {
  ws: WorkspaceDoc;
  purchaseStatus: string;
  tiers: BillingTierDoc[];
};

export function CreatorBillingActions({ ws, purchaseStatus, tiers }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const stripeReady = isStripeConfigured();
  const subscriptionTiers = tiers.filter((t) => t.id === "s" || t.id === "m" || t.id === "l");
  const atLimit =
    ws.questionCount >= ws.questionCountLimit ||
    ws.storageBytesUsed >= ws.storageBytesLimit;
  const canChooseSubscription =
    purchaseStatus === "active" && ws.subscriptionStatus !== "active";

  async function onStarter() {
    setErr("");
    setLoading("starter");
    try {
      await startStarterCheckout(ws.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "スターター決済の開始に失敗しました。");
      setLoading(null);
    }
  }

  async function onSubscription(tierId: "s" | "m" | "l") {
    setErr("");
    setLoading(tierId);
    try {
      await startSubscriptionCheckout(ws.id, tierId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "月額プランの開始に失敗しました。");
      setLoading(null);
    }
  }

  if (!stripeReady) {
    return (
      <p className="admin-msg" style={{ fontSize: "0.85rem" }}>
        Stripe の公開鍵（NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY）が未設定です。
      </p>
    );
  }

  return (
    <div>
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}

      {purchaseStatus !== "active" ? (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>
            スターター（¥980）で期限なく 200問・100MB まで利用できます。
          </p>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={loading !== null}
            onClick={() => void onStarter()}
          >
            {loading === "starter" ? "移動中…" : "スターターに登録（¥980）"}
          </button>
        </div>
      ) : null}

      {canChooseSubscription ? (
        <div>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>
            {atLimit
              ? "上限に達しています。月額プランで容量を広げられます。"
              : "スターター購入後は、いつでも月額プラン（S/M/L）に変更できます。"}
          </p>
          <div className="admin-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            {subscriptionTiers.map((t) => (
              <button
                key={t.id}
                type="button"
                className="admin-btn"
                disabled={loading !== null}
                onClick={() => void onSubscription(t.id as "s" | "m" | "l")}
              >
                {loading === t.id
                  ? "移動中…"
                  : `${t.displayName}（${t.monthlyPriceLabel ?? "要設定"}/月）`}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {purchaseStatus === "active" && ws.subscriptionStatus === "active" ? (
        <p className="admin-msg" style={{ fontSize: "0.85rem" }}>
          月額プラン契約中です。プラン名と上限は上の利用状況をご確認ください。
        </p>
      ) : null}
    </div>
  );
}
