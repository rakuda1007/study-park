"use client";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseApp } from "./client";
import { getFirestoreClient } from "./client";

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export async function signInAdmin(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  const ok = await isAdminUser(cred.user);
  if (!ok) {
    await signOut(getFirebaseAuth());
    throw new Error("このアカウントには管理者権限がありません。");
  }
  return cred.user;
}

export async function signOutAdmin() {
  await signOut(getFirebaseAuth());
}

export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user) return false;
  const snap = await getDoc(doc(getFirestoreClient(), "admins", user.uid));
  return snap.exists();
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
