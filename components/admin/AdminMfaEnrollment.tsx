"use client";

import { FormEvent, useEffect, useState } from "react";
import type { TotpSecret, User } from "firebase/auth";
import {
  adminMfaEnrolled,
  enrollAdminTotpMfa,
  generateAdminTotpEnrollment,
} from "@/lib/firebase/admin-mfa";

type Props = {
  user: User;
  onEnrolled: () => void;
};

export function AdminMfaEnrollment({ user, onEnrolled }: Props) {
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminMfaEnrolled(user)) {
      onEnrolled();
      return;
    }
    if (!user.emailVerified) {
      setError(
        "メールアドレスが未確認です。Firebase Console で確認済みにするか、scripts/verify-admin-email.mjs を実行してください。",
      );
      setLoading(false);
      return;
    }
    let cancelled = false;
    void generateAdminTotpEnrollment(user)
      .then((result) => {
        if (cancelled) return;
        setSecret(result.secret);
        setQrCodeUrl(result.qrCodeUrl);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "二段階認証の準備に失敗しました。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, onEnrolled]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!secret) return;
    setError("");
    setBusy(true);
    try {
      await enrollAdminTotpMfa(user, secret, code);
      onEnrolled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証コードが正しくありません。");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="admin-loading">二段階認証を準備中…</p>;
  }

  return (
    <div className="admin-login">
      <h2 className="admin-title" style={{ fontSize: "1.15rem" }}>
        二段階認証の設定
      </h2>
      <p style={{ color: "var(--admin-muted)", fontSize: "0.9rem" }}>
        Google Authenticator などの認証アプリで QR コードを読み取り、表示された6桁コードを入力してください。
      </p>
      <div className="admin-card" style={{ marginTop: "1rem" }}>
        {error ? <p className="admin-msg admin-msg--error">{error}</p> : null}
        {qrCodeUrl ? (
          <div className="admin-mfa-qr-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
              alt="二段階認証用 QR コード"
              width={200}
              height={200}
              className="admin-mfa-qr"
            />
          </div>
        ) : null}
        {secret ? (
          <p style={{ fontSize: "0.82rem", color: "var(--admin-muted)", wordBreak: "break-all" }}>
            QR が読み取れない場合は認証アプリに手動登録: <code>{secret.secretKey}</code>
          </p>
        ) : null}
        <form onSubmit={(e) => void onSubmit(e)}>
          <div className="admin-field">
            <label htmlFor="mfa-enroll-code">認証コード（6桁）</label>
            <input
              id="mfa-enroll-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={busy || !secret}>
            {busy ? "登録中…" : "二段階認証を有効化"}
          </button>
        </form>
      </div>
    </div>
  );
}
