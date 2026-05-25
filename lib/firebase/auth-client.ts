"use client";

import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createUserProfile, getUserProfile } from "@/lib/users/firestore";
import type { UserRole } from "@/lib/users/types";
import { createWorkspaceForCreator } from "@/lib/workspaces/firestore";
import { getFirebaseApp } from "./client";
import { getFirestoreClient } from "./client";

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

function mapAuthError(e: unknown): Error {
  const code =
    e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
  if (code === "auth/email-already-in-use") {
    return new Error("このメールアドレスは既に登録されています。");
  }
  if (code === "auth/invalid-email") {
    return new Error("メールアドレスの形式が正しくありません。");
  }
  if (code === "auth/weak-password") {
    return new Error("パスワードは6文字以上にしてください。");
  }
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return new Error("メールアドレスまたはパスワードが正しくありません。");
  }
  if (code === "auth/too-many-requests") {
    return new Error("試行回数が多すぎます。しばらく待ってから再度お試しください。");
  }
  if (e instanceof Error) return e;
  return new Error("認証に失敗しました。");
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    return cred.user;
  } catch (e) {
    throw mapAuthError(e);
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  role: UserRole,
  opts?: { displayName?: string; workspaceName?: string; workspaceSlug?: string },
): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    const user = cred.user;
    const existing = await getUserProfile(user.uid);
    if (!existing) {
      await createUserProfile(user.uid, email.trim(), role, opts?.displayName);
    }
    if (role === "creator") {
      await createWorkspaceForCreator(
        user.uid,
        opts?.workspaceName ?? "マイ教材",
        opts?.workspaceSlug ?? `creator-${user.uid.slice(0, 8)}`,
      );
    }
    return user;
  } catch (e) {
    throw mapAuthError(e);
  }
}

export async function signOutUser() {
  await signOut(getFirebaseAuth());
}

export async function signInAdmin(email: string, password: string) {
  const user = await signInWithEmail(email, password);
  const ok = await isAdminUser(user);
  if (!ok) {
    await signOut(getFirebaseAuth());
    throw new Error("このアカウントには管理者権限がありません。");
  }
  return user;
}

export async function signOutAdmin() {
  await signOutUser();
}

export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user) return false;
  const snap = await getDoc(doc(getFirestoreClient(), "admins", user.uid));
  return snap.exists();
}

export async function resolvePostLoginPath(uid: string): Promise<string> {
  const adminSnap = await getDoc(doc(getFirestoreClient(), "admins", uid));
  if (adminSnap.exists()) return "/admin/contents";
  const profile = await getUserProfile(uid);
  if (!profile) return "/signup";
  if (profile.role === "learner") return "/learner";
  return "/creator";
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
