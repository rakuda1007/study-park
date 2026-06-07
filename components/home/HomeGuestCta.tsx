"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  resolveAuthSession,
  subscribeAuth,
  waitForAuthReady,
  type AuthSessionKind,
} from "@/lib/firebase/auth-client";

export function HomeGuestCta() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSessionKind | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    void waitForAuthReady().then(() => {
      if (cancelled) return;
      unsub = subscribeAuth((user) => {
        void resolveAuthSession(user).then((kind) => {
          if (!cancelled) {
            setSession(kind);
            setReady(true);
          }
        });
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  if (!ready || session) return null;

  return (
    <div className="home-hero__cta-wrap">
      <Link href="/signup" className="home-hero__cta">
        今すぐ Study Park をはじめる（無料）
      </Link>
    </div>
  );
}
