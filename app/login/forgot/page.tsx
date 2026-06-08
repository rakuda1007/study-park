"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordReset } from "@/lib/firebase/auth-client";
import "../../auth/auth.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-root">
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 className="auth-title">パスワードの再設定</h1>
        {sent ? (
          <>
            <p className="auth-lead">
              入力いただいたメールアドレス宛に、パスワード再設定用のリンクを送信しました。
              メール内の手順に従って新しいパスワードを設定してください。
            </p>
            <p className="auth-msg--ok">
              届かない場合は迷惑メールフォルダをご確認ください。数分経っても届かないときは、入力したアドレスが登録済みかご確認のうえ再度お試しください。
            </p>
            <p className="auth-links">
              <Link href="/login">ログイン画面へ</Link>
              <br />
              <Link href="/">トップへ戻る</Link>
            </p>
          </>
        ) : (
          <>
            <p className="auth-lead">
              登録時のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
            </p>
            <form className="auth-card" onSubmit={(e) => void onSubmit(e)}>
              {error ? <p className="auth-msg--error">{error}</p> : null}
              <div className="auth-field">
                <label htmlFor="reset-email">
                  メールアドレス
                  <span className="auth-required" aria-hidden>
                    必須
                  </span>
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="auth-btn auth-btn--primary" disabled={busy}>
                {busy ? "送信中…" : "再設定メールを送信"}
              </button>
            </form>
            <p className="auth-links">
              <Link href="/login">ログイン画面へ戻る</Link>
              <br />
              <Link href="/">トップへ戻る</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
