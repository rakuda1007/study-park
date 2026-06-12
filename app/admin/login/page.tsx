"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import type { MultiFactorError, User } from "firebase/auth";
import { AdminMfaChallenge } from "@/components/admin/AdminMfaChallenge";
import { AdminMfaEnrollment } from "@/components/admin/AdminMfaEnrollment";
import {
  adminMfaEnrolled,
  isMultiFactorAuthRequiredError,
} from "@/lib/firebase/admin-mfa";
import {
  getFirebaseAuth,
  isAdminUser,
  signInWithEmail,
  signOutUser,
} from "@/lib/firebase/auth-client";

type LoginStep = "sign-in" | "mfa-challenge" | "mfa-enroll";

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceEnroll = searchParams.get("step") === "mfa-enroll";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<LoginStep>(forceEnroll ? "mfa-enroll" : "sign-in");
  const [mfaError, setMfaError] = useState<MultiFactorError | null>(null);
  const [signedInUser, setSignedInUser] = useState<User | null>(() => getFirebaseAuth().currentUser);

  useEffect(() => {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    void isAdminUser(user).then((ok) => {
      if (!ok) return;
      if (adminMfaEnrolled(user)) {
        router.replace("/admin/contents");
      }
    });
  }, [router]);

  async function ensureAdminUser(user: User): Promise<User> {
    const ok = await isAdminUser(user);
    if (!ok) {
      await signOutUser();
      throw new Error("このアカウントには管理者権限がありません。");
    }
    return user;
  }

  async function finishLogin(user: User) {
    const admin = await ensureAdminUser(user);
    if (!adminMfaEnrolled(admin)) {
      setSignedInUser(admin);
      setStep("mfa-enroll");
      return;
    }
    router.replace("/admin/contents");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await signInWithEmail(email, password);
      await finishLogin(user);
    } catch (err) {
      if (isMultiFactorAuthRequiredError(err)) {
        setMfaError(err);
        setStep("mfa-challenge");
        return;
      }
      setError(err instanceof Error ? err.message : "ログインに失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  if (step === "mfa-challenge" && mfaError) {
    return (
      <AdminMfaChallenge
        mfaError={mfaError}
        onVerified={(user) => {
          void finishLogin(user).catch((err) => {
            setError(err instanceof Error ? err.message : "ログインに失敗しました。");
            setStep("sign-in");
          });
        }}
      />
    );
  }

  if (step === "mfa-enroll") {
    const user = signedInUser ?? getFirebaseAuth().currentUser;
    if (!user) {
      return (
        <div className="admin-login">
          <p className="admin-msg admin-msg--error">ログインしてから二段階認証を設定してください。</p>
          <button type="button" className="admin-btn" onClick={() => setStep("sign-in")}>
            ログイン画面へ
          </button>
        </div>
      );
    }
    return (
      <AdminMfaEnrollment
        user={user}
        onEnrolled={() => {
          router.replace("/admin/contents");
        }}
      />
    );
  }

  return (
    <div className="admin-login">
      <h1 className="admin-title">Study Park 管理</h1>
      <p style={{ color: "var(--admin-muted)", fontSize: "0.9rem" }}>
        管理者アカウントでログインしてください。二段階認証が有効です。
      </p>
      <form className="admin-card" onSubmit={(e) => void onSubmit(e)} style={{ marginTop: "1rem" }}>
        {error ? <p className="admin-msg admin-msg--error">{error}</p> : null}
        <div className="admin-field">
          <label htmlFor="email">メールアドレス</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="admin-field">
          <label htmlFor="password">パスワード</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? "ログイン中…" : "ログイン"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/login/forgot" className="admin-link">
          パスワードをお忘れの方
        </Link>
        <br />
        <Link href="/" className="admin-link">
          トップへ戻る
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="admin-loading">読み込み中…</p>}>
      <AdminLoginInner />
    </Suspense>
  );
}
