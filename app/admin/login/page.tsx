"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signInAdmin } from "@/lib/firebase/auth-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInAdmin(email.trim(), password);
      router.replace("/admin/contents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-login">
      <h1 className="admin-title">Study Park 管理</h1>
      <p style={{ color: "var(--admin-muted)", fontSize: "0.9rem" }}>
        管理者アカウントでログインしてください。
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
