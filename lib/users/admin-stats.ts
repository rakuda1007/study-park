"use client";

import { collection, getCountFromServer, getDocs, type Timestamp } from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
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
      status: (purchase.status as UserProfile["appPurchase"]["status"]) ?? "none",
      purchasedAt: purchase.purchasedAt ? tsToIso(purchase.purchasedAt) : undefined,
      provider: purchase.provider ? String(purchase.provider) : undefined,
      paymentId: purchase.paymentId ? String(purchase.paymentId) : undefined,
    },
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

export type UserStats = {
  creators: number;
  registeredLearners: number;
  guestLearners: number;
};

export type GuestLearnerSummary = {
  id: string;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
  lastContentRef?: string;
};

export async function countGuestLearners(): Promise<number> {
  const snap = await getCountFromServer(collection(getFirestoreClient(), "guestLearners"));
  return snap.data().count;
}

export async function fetchUserStats(): Promise<UserStats> {
  const db = getFirestoreClient();
  const [usersSnap, guestCount] = await Promise.all([
    getDocs(collection(db, "users")),
    countGuestLearners(),
  ]);

  let creators = 0;
  let registeredLearners = 0;
  for (const doc of usersSnap.docs) {
    const role = doc.data().role;
    if (role === "learner") registeredLearners += 1;
    else creators += 1;
  }

  return { creators, registeredLearners, guestLearners: guestCount };
}

export async function listUsersByRole(role: UserRole): Promise<UserProfile[]> {
  const snap = await getDocs(collection(getFirestoreClient(), "users"));
  return snap.docs
    .map((d) => mapUser(d.id, d.data()))
    .filter((u) => u.role === role)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listRecentGuestLearners(limit = 20): Promise<GuestLearnerSummary[]> {
  const snap = await getDocs(collection(getFirestoreClient(), "guestLearners"));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        firstSeenAt: tsToIso(data.firstSeenAt),
        lastSeenAt: tsToIso(data.lastSeenAt),
        visitCount: typeof data.visitCount === "number" ? data.visitCount : 1,
        lastContentRef: data.lastContentRef ? String(data.lastContentRef) : undefined,
      };
    })
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
    .slice(0, limit);
}
