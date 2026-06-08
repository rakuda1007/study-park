"use client";

import { getFirebaseAuth } from "@/lib/firebase/auth-client";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { getFirebaseApp } from "@/lib/firebase/client";
import type { BillingTierId } from "./types";

function billingUsesApiRoutes(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_USE_API_ROUTES === "true";
}

async function getIdToken(): Promise<string> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("ログインが必要です。");
  return user.getIdToken();
}

function getBillingFunctions() {
  const region = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION?.trim() || "asia-northeast1";
  const functions = getFunctions(getFirebaseApp(), region);
  if (process.env.NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR === "true") {
    const host = process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST || "localhost";
    const port = Number(process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT || "5001");
    connectFunctionsEmulator(functions, host, port);
  }
  return functions;
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

async function callBillingFunction<T extends Record<string, string>>(
  name: string,
  data: T,
): Promise<string> {
  const fn = httpsCallable<T, { url: string }>(getBillingFunctions(), name);
  const result = await fn(data);
  if (!result.data?.url) throw new Error("Checkout URL を取得できませんでした。");
  return result.data.url;
}

export async function startStarterCheckout(workspaceId: string): Promise<void> {
  const url = billingUsesApiRoutes()
    ? await postBillingApi("/api/billing/checkout/starter", { workspaceId })
    : await callBillingFunction("createStarterCheckout", { workspaceId });
  window.location.assign(url);
}

export async function startSubscriptionCheckout(
  workspaceId: string,
  tierId: Extract<BillingTierId, "s" | "m" | "l">,
): Promise<void> {
  const url = billingUsesApiRoutes()
    ? await postBillingApi("/api/billing/checkout/subscription", { workspaceId, tierId })
    : await callBillingFunction("createSubscriptionCheckout", { workspaceId, tierId });
  window.location.assign(url);
}
