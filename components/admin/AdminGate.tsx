"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminAccessGateForm } from "@/components/admin/AdminAccessGateForm";
import { isAccessGateSessionValid } from "@/lib/admin/access-gate";
import { adminMfaEnrolled } from "@/lib/firebase/admin-mfa";
import { isAdminUser, subscribeAuth, waitForAuthReady } from "@/lib/firebase/auth-client";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [gateReady, setGateReady] = useState(false);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [authReady, setAuthReady] = useState(isLogin);
  const [allowed, setAllowed] = useState(isLogin);

  const refreshGate = useCallback(() => {
    setGateUnlocked(isAccessGateSessionValid());
    setGateReady(true);
  }, []);

  useEffect(() => {
    refreshGate();
  }, [refreshGate, pathname]);

  useEffect(() => {
    if (!gateUnlocked) return;
    if (isLogin) {
      setAuthReady(true);
      setAllowed(true);
      return;
    }

    let unsub: (() => void) | undefined;
    let cancelled = false;
    setAuthReady(false);

    void waitForAuthReady().then(() => {
      if (cancelled) return;
      unsub = subscribeAuth(async (user) => {
        const ok = await isAdminUser(user);
        if (!user || !ok) {
          router.replace("/admin/login");
          setAllowed(false);
          setAuthReady(true);
          return;
        }
        if (!adminMfaEnrolled(user)) {
          router.replace("/admin/login?step=mfa-enroll");
          setAllowed(false);
          setAuthReady(true);
          return;
        }
        setAllowed(true);
        setAuthReady(true);
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [gateUnlocked, isLogin, router]);

  if (!gateReady) {
    return <p className="admin-loading">読み込み中…</p>;
  }

  if (!gateUnlocked) {
    return <AdminAccessGateForm onUnlocked={refreshGate} />;
  }

  if (!authReady) {
    return <p className="admin-loading">読み込み中…</p>;
  }

  if (!allowed && !isLogin) {
    return null;
  }

  return <>{children}</>;
}
