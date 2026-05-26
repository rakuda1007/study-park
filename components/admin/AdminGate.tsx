"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdminUser, subscribeAuth, waitForAuthReady } from "@/lib/firebase/auth-client";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(isLogin);
  const [allowed, setAllowed] = useState(isLogin);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      setAllowed(true);
      return;
    }

    let unsub: (() => void) | undefined;
    let cancelled = false;
    setReady(false);

    void waitForAuthReady().then(() => {
      if (cancelled) return;
      unsub = subscribeAuth(async (user) => {
        const ok = await isAdminUser(user);
        if (!user || !ok) {
          router.replace("/admin/login");
          setAllowed(false);
          setReady(true);
          return;
        }
        setAllowed(true);
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [isLogin, router]);

  if (!ready) {
    return <p className="admin-loading">読み込み中…</p>;
  }
  if (!allowed && !isLogin) {
    return null;
  }
  return <>{children}</>;
}
