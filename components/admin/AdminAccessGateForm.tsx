"use client";

import { FormEvent, useState } from "react";
import {
  isAccessGateSessionValid,
  storeAccessGateSession,
  verifyAdminAccessGate,
} from "@/lib/admin/access-gate";

type Props = {
  onUnlocked: () => void;
};

export function AdminAccessGateForm({ onUnlocked }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const session = await verifyAdminAccessGate(username, password);
      storeAccessGateSession(session);
      onUnlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  if (isAccessGateSessionValid()) {
    return null;
  }

  return (
    <div className="admin-login">
      <h1 className="admin-title">管理画面アクセス認証</h1>
      <p style={{ color: "var(--admin-muted)", fontSize: "0.9rem" }}>
        管理者向け画面です。ベーシック認証のユーザー名とパスワードを入力してください。
      </p>
      <form className="admin-card" onSubmit={(e) => void onSubmit(e)} style={{ marginTop: "1rem" }}>
        {error ? <p className="admin-msg admin-msg--error">{error}</p> : null}
        <div className="admin-field">
          <label htmlFor="gate-username">ユーザー名</label>
          <input
            id="gate-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="admin-field">
          <label htmlFor="gate-password">パスワード</label>
          <input
            id="gate-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? "確認中…" : "続ける"}
        </button>
      </form>
    </div>
  );
}
