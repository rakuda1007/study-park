"use client";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";

const STORAGE_KEY = "study-park-guest-id";

function randomGuestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `g_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
  }
  return `g_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return randomGuestId();
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
    const id = randomGuestId();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return randomGuestId();
  }
}

/** ログインなしでコンテンツを利用した記録（管理者の利用者集計用） */
export async function recordGuestContentUse(contentRef: string): Promise<void> {
  const guestId = getOrCreateGuestId();
  const ref = doc(getFirestoreClient(), "guestLearners", guestId);
  const snap = await getDoc(ref);
  const content = contentRef.trim().slice(0, 120);

  if (snap.exists()) {
    const prev = snap.data()?.visitCount;
    const visitCount = (typeof prev === "number" ? prev : 0) + 1;
    await updateDoc(ref, {
      lastSeenAt: serverTimestamp(),
      lastContentRef: content || null,
      visitCount,
    });
    return;
  }

  await setDoc(ref, {
    firstSeenAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
    lastContentRef: content || null,
    visitCount: 1,
  });
}
