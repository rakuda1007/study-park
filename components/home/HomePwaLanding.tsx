"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isForcePublicHome, isStandaloneDisplayMode } from "@/lib/pwa/standalone";

type Gate = "show" | "checking";

/**
 * PWA 起動時: ログイン済みならロール別ホームへ（学習者は /learner）。
 * ブラウザで / を開いたときは初期から公園トップを表示（Auth SDK は読み込まない）。
 */
export function HomePwaLanding({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>("show");

  useEffect(() => {
    if (isForcePublicHome() || !isStandaloneDisplayMode()) {
      return;
    }

    setGate("checking");
    let cancelled = false;
    let unsub: (() => void) | undefined;

    void import("@/lib/firebase/auth-client").then(
      ({ waitForAuthReady, subscribeAuth, resolveAuthSession, homePathForSession }) => {
        if (cancelled) return;
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
      },
    );

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
