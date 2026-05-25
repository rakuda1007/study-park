"use client";

import { doc, getDoc, serverTimestamp, setDoc, updateDoc, type Timestamp } from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import type { AppPurchaseStatus } from "@/lib/billing/types";
import type { UserProfile, UserRole } from "./types";

function tsToIso(v: unknown): string {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as Timestamp).toDate().toISOString();
  }
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

function mapUser(uid: string, data: Record<string, unknown>): UserProfile {
  const purchase = (data.appPurchase as Record<string, unknown>) ?? {};
  return {
    uid,
    email: String(data.email ?? ""),
    displayName: data.displayName ? String(data.displayName) : undefined,
    role: data.role === "learner" ? "learner" : "creator",
    appPurchase: {
      status: (purchase.status as AppPurchaseStatus) ?? "none",
      purchasedAt: purchase.purchasedAt ? tsToIso(purchase.purchasedAt) : undefined,
      provider: purchase.provider ? String(purchase.provider) : undefined,
      paymentId: purchase.paymentId ? String(purchase.paymentId) : undefined,
    },
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getFirestoreClient(), "users", uid));
  if (!snap.exists()) return null;
  return mapUser(snap.id, snap.data());
}

export async function createUserProfile(
  uid: string,
  email: string,
  role: UserRole,
  displayName?: string,
): Promise<UserProfile> {
  const ref = doc(getFirestoreClient(), "users", uid);
  const payload = {
    email,
    displayName: displayName?.trim() || null,
    role,
    appPurchase: { status: "none" as const },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  const snap = await getDoc(ref);
  return mapUser(uid, snap.data() ?? payload);
}

export async function updateUserAppPurchase(
  uid: string,
  status: AppPurchaseStatus,
  extra?: { paymentId?: string; provider?: string },
): Promise<void> {
  await updateDoc(doc(getFirestoreClient(), "users", uid), {
    appPurchase: {
      status,
      ...(status === "active"
        ? { purchasedAt: serverTimestamp(), provider: extra?.provider ?? "stripe" }
        : {}),
      ...(extra?.paymentId ? { paymentId: extra.paymentId } : {}),
    },
    updatedAt: serverTimestamp(),
  });
}
