"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MultiFactorError } from "firebase/auth";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { TotpMfaChallenge } from "@/components/auth/TotpMfaChallenge";
import { resolvePostLoginPath, signInWithEmail } from "@/lib/firebase/auth-client";
import "../auth/auth.css";

export default function LoginPage() {
  const router = useRouter();
  const [mfaError, setMfaError] = useState<MultiFactorError | null>(null);

  if (mfaError) {
    return (
      <div className="auth-root">
        <div style={{ width: "100%", maxWidth: 420 }}>
          <TotpMfaChallenge
            mfaError={mfaError}
            onVerified={(user) => {
              void resolvePostLoginPath(user.uid).then((path) => router.replace(path));
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
            const path = await resolvePostLoginPath(user.uid);
            router.replace(path);
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
