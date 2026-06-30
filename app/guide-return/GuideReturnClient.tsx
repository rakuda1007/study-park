"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  homePathForSession,
  resolveAuthSession,
  subscribeAuth,
  waitForAuthReady,
} from "@/lib/firebase/auth-client";

/**
 * シリーズポータル等の外部ガイドから「アプリへ戻る」用。
 * ログイン済みならロール別ホームへ、未ログインなら公園トップ（/）へ。
 */
export function GuideReturnClient() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    void waitForAuthReady().then(() => {
      if (cancelled) return;
      unsub = subscribeAuth((user) => {
        void resolveAuthSession(user).then((kind) => {
          if (cancelled) return;
          router.replace(kind ? homePathForSession(kind) : "/");
        });
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [router]);

  return (
    <main className="home home--pwa-loading">
      <p className="home-pwa-loading__text" role="status">
        読み込み中…
      </p>
    </main>
  );
}
