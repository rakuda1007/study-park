"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  setStoredActiveMode,
  subscribeActiveMode,
  syncActiveModeWithPath,
  type DualRoleMode,
} from "@/lib/auth/active-session";
import {
  getFirebaseAuth,
  homePathForSession,
  resolveAuthSessionState,
  subscribeAuth,
  waitForAuthReady,
  type AuthSessionKind,
} from "@/lib/firebase/auth-client";
import type { User } from "firebase/auth";

type Snapshot = {
  ready: boolean;
  uid: string | null;
  session: AuthSessionKind | null;
  canSwitchMode: boolean;
};

const serverSnapshot: Snapshot = {
  ready: false,
  uid: null,
  session: null,
  canSwitchMode: false,
};

let snapshot: Snapshot = serverSnapshot;
const listeners = new Set<() => void>();
let bootstrapped = false;
let refreshSeq = 0;
let latestPathname = "/";

function emit() {
  for (const listener of listeners) listener();
}

async function refresh(user: User | null, pathname: string) {
  const seq = ++refreshSeq;
  if (!user) {
    snapshot = { ready: true, uid: null, session: null, canSwitchMode: false };
    emit();
    return;
  }

  // uid だけ先に公開（session 解決待ちでも plan キャッシュ表示に使う）
  if (snapshot.uid !== user.uid) {
    snapshot = { ...snapshot, uid: user.uid };
    emit();
  }

  syncActiveModeWithPath(pathname);
  const { kind, canSwitchMode } = await resolveAuthSessionState(user);
  if (seq !== refreshSeq) return;

  snapshot = { ready: true, uid: user.uid, session: kind, canSwitchMode };
  emit();
}

function bootstrap() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;

  void waitForAuthReady().then(() => {
    subscribeAuth((user) => {
      void refresh(user, latestPathname);
    });
  });

  subscribeActiveMode(() => {
    void refresh(getFirebaseAuth().currentUser, latestPathname);
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  bootstrap();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

export function useShellSession() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, uid, session, canSwitchMode } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    const pathChanged = latestPathname !== pathname;
    latestPathname = pathname;
    if (!ready || !pathChanged) return;
    void refresh(getFirebaseAuth().currentUser, pathname);
  }, [pathname, ready]);

  const switchMode = useCallback(() => {
    if (!canSwitchMode || !session) return;
    const next: DualRoleMode = session === "admin" ? "creator" : "admin";
    setStoredActiveMode(next);
    router.push(homePathForSession(next));
    router.refresh();
  }, [canSwitchMode, router, session]);

  return { ready, uid, session, canSwitchMode, switchMode };
}
