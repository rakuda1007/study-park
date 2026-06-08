"use client";

import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { absoluteSiteUrl } from "@/lib/site-url";
import { doc, getDoc } from "firebase/firestore";
import { createUserProfile, getUserProfile } from "@/lib/users/firestore";
import type { UserRole } from "@/lib/users/types";
import { createWorkspaceForCreator } from "@/lib/workspaces/firestore";
import { getFirebaseApp } from "./client";
import { getFirestoreClient } from "./client";

export function getFirebaseAuth() {
  const auth = getAuth(getFirebaseApp());
  // Firebase 標準メール・再設定画面の言語（コンソールでテンプレート編集不可でも ja が効く）
  auth.languageCode = "ja";
  return auth;
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
  if (code === "auth/unauthorized-continue-uri") {
    return new Error(
      "このサイトのドメインが Firebase の承認済みドメインに登録されていません。Authentication → Settings → 承認済みドメインに、現在アクセスしているホスト名を追加してください。",
    );
  }
  if (code === "permission-denied") {
    return new Error(
      "データの保存権限がありません。Firestore のルールが未デプロイの可能性があります。時間をおいてログインし直すか、管理者に連絡してください。",
    );
  }
  if (e instanceof Error) return e;
  return new Error("認証に失敗しました。");
}

function authErrorCode(e: unknown): string {
  return e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
}

/** 再設定完了後に戻すオリジン（承認済みドメインと揃える） */
function passwordResetContinueOrigin(): string {
  if (typeof window === "undefined") {
    return absoluteSiteUrl("/login").replace(/\/login\/?$/, "");
  }

  const { hostname, port, protocol } = window.location;

  // 127.0.0.1 は Firebase 既定の承認済みに無いことが多い → localhost に寄せる
  if (hostname === "127.0.0.1") {
    const p = port ? `:${port}` : "";
    return `${protocol}//localhost${p}`;
  }

  // www 付きで開いていると continueUrl のホストが未登録になりやすい → apex へ
  if (hostname === "www.study.tennis-community.com") {
    return "https://study.tennis-community.com";
  }

  return window.location.origin;
}

/** 再設定完了後に戻す URL */
function passwordResetContinueUrl(): string {
  return new URL("/login", passwordResetContinueOrigin()).href;
}

/** パスワード再設定メールを送信（登録の有無は応答に含めない） */
export async function requestPasswordReset(email: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) {
    throw new Error("メールアドレスを入力してください。");
  }
  const auth = getFirebaseAuth();
  const continueUrl = passwordResetContinueUrl();
  try {
    await sendPasswordResetEmail(auth, trimmed, {
      url: continueUrl,
      handleCodeInApp: false,
    });
  } catch (e) {
    // continueUrl のドメイン未登録時は URL なしで再送（メール自体は届く）
    if (authErrorCode(e) === "auth/unauthorized-continue-uri") {
      try {
        await sendPasswordResetEmail(auth, trimmed);
        return;
      } catch (retryErr) {
        if (typeof window !== "undefined") {
          throw new Error(
            `パスワード再設定メールを送信できませんでした。Firebase の承認済みドメインに「${window.location.hostname}」を追加してください。`,
          );
        }
        throw mapAuthError(retryErr);
      }
    }
    throw mapAuthError(e);
  }
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
  opts?: {
    displayName?: string;
    familyName?: string;
    givenName?: string;
    workspaceName?: string;
    workspaceSlug?: string;
  },
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
      await createUserProfile(user.uid, email.trim(), role, {
        displayName: opts?.displayName,
        familyName: opts?.familyName,
        givenName: opts?.givenName,
      });
    }
    if (role === "creator") {
      await createWorkspaceForCreator(user.uid, opts?.workspaceName ?? "マイ教材", opts?.workspaceSlug);
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

export type AuthSessionKind = "admin" | "creator" | "learner";

export function homePathForSession(kind: AuthSessionKind): string {
  switch (kind) {
    case "admin":
      return "/admin/contents";
    case "creator":
      return "/creator";
    case "learner":
      return "/learner";
  }
}

export async function resolveAuthSession(user: User | null): Promise<AuthSessionKind | null> {
  if (!user) return null;
  if (await isAdminUser(user)) return "admin";
  const profile = await getUserProfile(user.uid);
  if (!profile) return null;
  return profile.role === "learner" ? "learner" : "creator";
}

export async function resolvePostLoginPath(uid: string): Promise<string> {
  const adminSnap = await getDoc(doc(getFirestoreClient(), "admins", uid));
  if (adminSnap.exists()) return homePathForSession("admin");
  const profile = await getUserProfile(uid);
  if (!profile) return "/signup";
  return homePathForSession(profile.role === "learner" ? "learner" : "creator");
}

/** 永続化されたセッション復元が終わるまで待つ（ゲートの誤リダイレクト防止） */
export function waitForAuthReady(): Promise<void> {
  const auth = getFirebaseAuth();
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, () => {
      unsub();
      resolve();
    });
  });
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
