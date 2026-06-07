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
    familyName: data.familyName ? String(data.familyName) : undefined,
    givenName: data.givenName ? String(data.givenName) : undefined,
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

function composeDisplayName(familyName?: string, givenName?: string, fallback?: string): string | null {
  const family = familyName?.trim() ?? "";
  const given = givenName?.trim() ?? "";
  if (family && given) return `${family} ${given}`;
  const fb = fallback?.trim();
  return fb || null;
}

export type CreateUserProfileOpts = {
  displayName?: string;
  familyName?: string;
  givenName?: string;
};

export async function createUserProfile(
  uid: string,
  email: string,
  role: UserRole,
  opts?: string | CreateUserProfileOpts,
): Promise<UserProfile> {
  const options: CreateUserProfileOpts =
    typeof opts === "string" ? { displayName: opts } : (opts ?? {});
  const familyName = options.familyName?.trim() || null;
  const givenName = options.givenName?.trim() || null;
  const displayName = composeDisplayName(
    familyName ?? undefined,
    givenName ?? undefined,
    options.displayName,
  );
  const ref = doc(getFirestoreClient(), "users", uid);
  const payload = {
    email,
    familyName,
    givenName,
    displayName,
    role,
    appPurchase: { status: "none" as const },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  const snap = await getDoc(ref);
  return mapUser(uid, snap.data() ?? payload);
}

export async function updateLearnerProfile(
  uid: string,
  input: { familyName: string; givenName: string },
): Promise<void> {
  const familyName = input.familyName.trim();
  const givenName = input.givenName.trim();
  if (!familyName || !givenName) {
    throw new Error("姓と名を入力してください。");
  }
  await updateDoc(doc(getFirestoreClient(), "users", uid), {
    familyName,
    givenName,
    displayName: `${familyName} ${givenName}`,
    updatedAt: serverTimestamp(),
  });
}

/** 既存学習者で姓名未登録の場合に初期値を入れる（移行用） */
export async function backfillLearnerNamesIfEmpty(uid: string): Promise<void> {
  const profile = await getUserProfile(uid);
  if (!profile || profile.role !== "learner") return;
  if (profile.familyName?.trim() || profile.givenName?.trim()) return;
  await updateLearnerProfile(uid, { familyName: "奥田", givenName: "柑菜" });
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
