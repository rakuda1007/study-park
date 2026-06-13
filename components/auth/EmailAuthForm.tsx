"use client";

import { FormEvent, useState } from "react";
import type { MultiFactorError } from "firebase/auth";
import { isMultiFactorAuthRequiredError } from "@/lib/firebase/admin-mfa";

type Props = {
  submitLabel: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  onMultiFactorRequired?: (error: MultiFactorError) => void;
  children?: React.ReactNode;
  /** 登録シェル内など、外側にカードがあるときは true */
  embedded?: boolean;
};

export function EmailAuthForm({
  submitLabel,
  onSubmit,
  onMultiFactorRequired,
  children,
  embedded = false,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(email.trim(), password);
    } catch (err) {
      if (isMultiFactorAuthRequiredError(err) && onMultiFactorRequired) {
        onMultiFactorRequired(err);
        return;
      }
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className={embedded ? "auth-form" : "auth-card"}
      onSubmit={(e) => void handleSubmit(e)}
    >
      {error ? <p className="auth-msg--error">{error}</p> : null}
      {children}
      <div className="auth-field">
        <label htmlFor="auth-email">
          メールアドレス
          <span className="auth-required" aria-hidden>
            必須
          </span>
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="auth-field">
        <label htmlFor="auth-password">
          パスワード
          <span className="auth-required" aria-hidden>
            必須
          </span>
        </label>
        <input
          id="auth-password"
          type="password"
          autoComplete={submitLabel.includes("登録") ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <button type="submit" className="auth-btn auth-btn--primary" disabled={busy}>
        {busy ? "処理中…" : submitLabel}
      </button>
    </form>
  );
}
