"use client";

import { FormEvent, useState } from "react";
import type { MultiFactorError, User } from "firebase/auth";
import { resolveAdminTotpMfaSignIn } from "@/lib/firebase/admin-mfa";

type Props = {
  mfaError: MultiFactorError;
  onVerified: (user: User) => void;
};

export function TotpMfaChallenge({ mfaError, onVerified }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await resolveAdminTotpMfaSignIn(mfaError, code);
      onVerified(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証コードが正しくありません。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h2 className="auth-title" style={{ fontSize: "1.15rem" }}>
        二段階認証
      </h2>
      <p className="auth-lead" style={{ marginBottom: "1rem" }}>
        認証アプリに表示されている6桁コードを入力してください。
      </p>
      <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
        {error ? <p className="auth-msg--error">{error}</p> : null}
        <div className="auth-field">
          <label htmlFor="auth-mfa-code">認証コード</label>
          <input
            id="auth-mfa-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-btn auth-btn--primary" disabled={busy}>
          {busy ? "確認中…" : "ログインを完了"}
        </button>
      </form>
    </div>
  );
}
