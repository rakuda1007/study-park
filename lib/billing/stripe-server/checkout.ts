import type { BillingTierId } from "../types";
import { assertWorkspaceOwner } from "./apply";
import { billingSiteUrl, getStarterPriceId } from "./config";
import { getAdminFirestore } from "./firestore-admin";
import { getStripe } from "./stripe";

export async function createStarterCheckoutSession(input: {
  uid: string;
  email?: string;
  workspaceId: string;
}): Promise<string> {
  const db = getAdminFirestore();
  await assertWorkspaceOwner(db, input.workspaceId, input.uid);

  const userSnap = await db.collection("users").doc(input.uid).get();
  const purchase = userSnap.data()?.appPurchase as { status?: string } | undefined;
  if (purchase?.status === "active") {
    throw new Error("スターターは既に購入済みです。");
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: getStarterPriceId(), quantity: 1 }],
    success_url: billingSiteUrl(
      `/creator/billing/success?kind=starter&session_id={CHECKOUT_SESSION_ID}`,
    ),
    cancel_url: billingSiteUrl("/creator/billing/cancel"),
    client_reference_id: input.uid,
    customer_email: input.email,
    metadata: {
      type: "starter",
      uid: input.uid,
      workspaceId: input.workspaceId,
    },
  });

  if (!session.url) throw new Error("Checkout URL の取得に失敗しました。");
  return session.url;
}

export async function createSubscriptionCheckoutSession(input: {
  uid: string;
  email?: string;
  workspaceId: string;
  tierId: "s" | "m" | "l";
  priceId: string;
}): Promise<string> {
  const db = getAdminFirestore();
  await assertWorkspaceOwner(db, input.workspaceId, input.uid);

  const userSnap = await db.collection("users").doc(input.uid).get();
  const purchase = userSnap.data()?.appPurchase as { status?: string } | undefined;
  if (purchase?.status !== "active") {
    throw new Error("月額プランの契約にはスターター登録が必要です。");
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: billingSiteUrl(
      `/creator/billing/success?kind=subscription&tier=${input.tierId}&session_id={CHECKOUT_SESSION_ID}`,
    ),
    cancel_url: billingSiteUrl("/creator/billing/cancel"),
    client_reference_id: input.uid,
    customer_email: input.email,
    metadata: {
      type: "subscription",
      tierId: input.tierId,
      uid: input.uid,
      workspaceId: input.workspaceId,
    },
    subscription_data: {
      metadata: {
        tierId: input.tierId,
        uid: input.uid,
        workspaceId: input.workspaceId,
      },
    },
  });

  if (!session.url) throw new Error("Checkout URL の取得に失敗しました。");
  return session.url;
}

export async function resolveSubscriptionPriceId(tierId: BillingTierId): Promise<string> {
  if (tierId !== "s" && tierId !== "m" && tierId !== "l") {
    throw new Error("月額プラン ID が不正です。");
  }
  const db = getAdminFirestore();
  const snap = await db.collection("billingTiers").doc(tierId).get();
  const fromDoc = snap.data()?.stripePriceId ? String(snap.data()?.stripePriceId).trim() : "";
  if (fromDoc) return fromDoc;
  throw new Error(`billingTiers/${tierId}.stripePriceId が未設定です。`);
}
