"use client";

import { FormEvent, useState } from "react";
import type { MultiFactorError, User } from "firebase/auth";
import { resolveAdminTotpMfaSignIn } from "@/lib/firebase/admin-mfa";

type Props = {
  mfaError: MultiFactorError;
  onVerified: (user: User) => void;
};

export function AdminMfaChallenge({ mfaError, onVerified }: Props) {
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
    <div className="admin-login">
      <h2 className="admin-title" style={{ fontSize: "1.15rem" }}>
        二段階認証
      </h2>
      <p style={{ color: "var(--admin-muted)", fontSize: "0.9rem" }}>
        認証アプリに表示されている6桁コードを入力してください。
      </p>
      <form className="admin-card" onSubmit={(e) => void onSubmit(e)} style={{ marginTop: "1rem" }}>
        {error ? <p className="admin-msg admin-msg--error">{error}</p> : null}
        <div className="admin-field">
          <label htmlFor="mfa-code">認証コード</label>
          <input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? "確認中…" : "ログインを完了"}
        </button>
      </form>
    </div>
  );
}
