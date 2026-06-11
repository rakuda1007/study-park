"use client";

import { getFirebaseAuth } from "@/lib/firebase/auth-client";
import type { BillingTierId } from "./types";

function billingUsesApiRoutes(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_USE_API_ROUTES === "true";
}

function billingFunctionsBaseUrl(): string {
  const region = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION?.trim() || "asia-northeast1";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) throw new Error("Firebase プロジェクト ID が未設定です。");
  return `https://${region}-${projectId}.cloudfunctions.net`;
}

async function getIdToken(): Promise<string> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("ログインが必要です。");
  return user.getIdToken();
}

async function postBillingApi(path: string, body: Record<string, string>): Promise<string> {
  const token = await getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) throw new Error(data.error || "決済の開始に失敗しました。");
  if (!data.url) throw new Error("Checkout URL を取得できませんでした。");
  return data.url;
}

export async function startStarterCheckout(workspaceId: string): Promise<void> {
  const url = billingUsesApiRoutes()
    ? await postBillingApi("/api/billing/checkout/starter", { workspaceId })
    : await postBillingApi(`${billingFunctionsBaseUrl()}/createStarterCheckout`, { workspaceId });
  window.location.assign(url);
}

export async function startSubscriptionCheckout(
  workspaceId: string,
  tierId: Extract<BillingTierId, "s" | "m" | "l">,
): Promise<void> {
  const url = billingUsesApiRoutes()
    ? await postBillingApi("/api/billing/checkout/subscription", { workspaceId, tierId })
    : await postBillingApi(`${billingFunctionsBaseUrl()}/createSubscriptionCheckout`, {
        workspaceId,
        tierId,
      });
  window.location.assign(url);
}
