"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { MultiFactorError } from "firebase/auth";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { TotpMfaChallenge } from "@/components/auth/TotpMfaChallenge";
import { resolvePostLoginPath, signInWithEmail } from "@/lib/firebase/auth-client";
import "../auth/auth.css";

function safeNextPath(raw: string | null): string | null {
  if (!raw?.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [mfaError, setMfaError] = useState<MultiFactorError | null>(null);

  async function finishLogin(uid: string) {
    if (nextPath) {
      router.replace(nextPath);
      return;
    }
    const path = await resolvePostLoginPath(uid);
    router.replace(path);
  }

  if (mfaError) {
    return (
      <div className="auth-root">
        <div style={{ width: "100%", maxWidth: 420 }}>
          <TotpMfaChallenge
            mfaError={mfaError}
            onVerified={(user) => {
              void finishLogin(user.uid);
            }}
          />
          <p className="auth-links">
            <button
              type="button"
              className="auth-mode-toggle__btn"
              onClick={() => setMfaError(null)}
            >
              メール・パスワード入力に戻る
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 className="auth-title">ログイン</h1>
        <p className="auth-lead">Study Park アカウントでログインしてください。</p>
        <EmailAuthForm
          submitLabel="ログイン"
          onMultiFactorRequired={setMfaError}
          onSubmit={async (email, password) => {
            const user = await signInWithEmail(email, password);
            await finishLogin(user.uid);
          }}
        />
        <p className="auth-links">
          <Link href="/login/forgot">パスワードをお忘れの方</Link>
          <br />
          アカウントをお持ちでない方は{" "}
          <Link href="/signup">新規登録</Link>
          <br />
          <Link href="/">トップへ戻る</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-root">読み込み中…</div>}>
      <LoginInner />
    </Suspense>
  );
}
