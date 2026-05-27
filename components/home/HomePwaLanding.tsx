"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  homePathForSession,
  resolveAuthSession,
  subscribeAuth,
  waitForAuthReady,
} from "@/lib/firebase/auth-client";
import { isForcePublicHome, isStandaloneDisplayMode } from "@/lib/pwa/standalone";

type Gate = "checking" | "show";

/**
 * PWA 起動時: ログイン済みならロール別ホームへ（学習者は /learner）。
 * ブラウザで / を開いたときは従来どおり公園トップを表示。
 */
export function HomePwaLanding({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>("checking");

  useEffect(() => {
    if (isForcePublicHome() || !isStandaloneDisplayMode()) {
      setGate("show");
      return;
    }

    let cancelled = false;
    let unsub: (() => void) | undefined;

    void waitForAuthReady().then(() => {
      if (cancelled) return;
      unsub = subscribeAuth((user) => {
        void resolveAuthSession(user).then((kind) => {
          if (cancelled) return;
          if (kind) {
            router.replace(homePathForSession(kind));
            return;
          }
          setGate("show");
        });
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [router]);

  if (gate === "checking") {
    return (
      <main className="home home--pwa-loading">
        <p className="home-pwa-loading__text" role="status">
          読み込み中…
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
