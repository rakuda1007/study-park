"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  setStoredActiveMode,
  subscribeActiveMode,
  syncActiveModeWithPath,
  type DualRoleMode,
} from "@/lib/auth/active-session";
import {
  getFirebaseAuth,
  homePathForSession,
  isAdminUser,
  resolveAuthSession,
  subscribeAuth,
  waitForAuthReady,
  type AuthSessionKind,
} from "@/lib/firebase/auth-client";
import { getUserProfile } from "@/lib/users/firestore";
import type { User } from "firebase/auth";

export function useShellSession() {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSessionKind | null>(null);
  const [canSwitchMode, setCanSwitchMode] = useState(false);

  const refresh = useCallback(
    async (user: User | null) => {
      if (!user) {
        setSession(null);
        setCanSwitchMode(false);
        setReady(true);
        return;
      }

      syncActiveModeWithPath(pathname);

      const [admin, profile, kind] = await Promise.all([
        isAdminUser(user),
        getUserProfile(user.uid),
        resolveAuthSession(user),
      ]);

      setCanSwitchMode(admin && profile?.role === "creator");
      setSession(kind);
      setReady(true);
    },
    [pathname],
  );

  useEffect(() => {
    let unsubAuth: (() => void) | undefined;
    let cancelled = false;

    void waitForAuthReady().then(() => {
      if (cancelled) return;
      unsubAuth = subscribeAuth((user) => {
        void refresh(user);
      });
    });

    const unsubMode = subscribeActiveMode(() => {
      void refresh(getFirebaseAuth().currentUser);
    });

    return () => {
      cancelled = true;
      unsubAuth?.();
      unsubMode();
    };
  }, [refresh]);

  const switchMode = useCallback(() => {
    if (!canSwitchMode || !session) return;
    const next: DualRoleMode = session === "admin" ? "creator" : "admin";
    setStoredActiveMode(next);
    router.push(homePathForSession(next));
    router.refresh();
  }, [canSwitchMode, router, session]);

  return { ready, session, canSwitchMode, switchMode };
}
