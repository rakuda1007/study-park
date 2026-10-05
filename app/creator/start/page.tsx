"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getUserProfile } from "@/lib/users/firestore";
import { upgradeLearnerToCreator } from "@/lib/users/upgrade-to-creator";
import { subscribeAuth, waitForAuthReady } from "@/lib/firebase/auth-client";

export default function CreatorStartPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("マイ教材");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    void waitForAuthReady().then(() => {
      if (cancelled) return;
      unsub = subscribeAuth((user) => {
        if (cancelled) return;
        if (!user) {
          router.replace("/login?next=/creator/start");
          return;
        }
        void getUserProfile(user.uid).then((profile) => {
          if (cancelled) return;
          if (profile?.role === "creator") {
            router.replace("/creator");
            return;
          }
          setUid(user.uid);
          setChecking(false);
        });
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setError("");
    setBusy(true);
    try {
      await upgradeLearnerToCreator(uid, workspaceName);
      router.replace("/creator");
    } catch (err) {
      setError(err instanceof Error ? err.message : "クリエイター機能の開始に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return <p className="admin-loading">読み込み中…</p>;
  }

  return (
    <div className="admin-login" style={{ maxWidth: 520, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 className="admin-title">問題を作って配る</h1>
      <p style={{ color: "var(--admin-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
        学習管理に、問題づくり・配信の機能を追加します。お試しプラン（80問・100MB）ですぐに始められます。お試し終了後や上限到達時は、
        <Link href="/creator/usage">利用状況</Link> からスターター（¥980）を購入できます。
      </p>
      <form className="admin-card" onSubmit={(e) => void onSubmit(e)} style={{ marginTop: "1rem" }}>
        {error ? <p className="admin-msg admin-msg--error">{error}</p> : null}
        <div className="admin-field">
          <label htmlFor="start-ws-name">教室・教材庫の名前</label>
          <input
            id="start-ws-name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="例：山田クラス、家庭学習"
            required
          />
          <p className="auth-hint" style={{ marginTop: "0.35rem" }}>
            教材のまとまりの名前です（あとで変更できます）。学習者の画面に表示されます。
          </p>
        </div>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? "準備中…" : "問題づくりをはじめる"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.88rem" }}>
        <Link href="/learner">学習管理へ戻る</Link>
      </p>
    </div>
  );
}
