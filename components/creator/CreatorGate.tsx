"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/users/firestore";
import { subscribeAuth, waitForAuthReady } from "@/lib/firebase/auth-client";
import { createWorkspaceForCreator, getWorkspaceByOwner } from "@/lib/workspaces/firestore";

const PUBLIC_PATHS = ["/creator/login"];

export function CreatorGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);
  const [ready, setReady] = useState(isPublic);
  const [allowed, setAllowed] = useState(isPublic);

  useEffect(() => {
    if (isPublic) {
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
        if (!user) {
          router.replace("/login?next=/creator");
          setAllowed(false);
          setReady(true);
          return;
        }
        const profile = await getUserProfile(user.uid);
        if (!profile || profile.role !== "creator") {
          router.replace("/signup/creator");
          setAllowed(false);
          setReady(true);
          return;
        }
        let ws = await getWorkspaceByOwner(user.uid);
        if (!ws) {
          try {
            ws = await createWorkspaceForCreator(
              user.uid,
              profile.displayName || "マイ教材",
              `creator-${user.uid.slice(0, 8)}`,
            );
          } catch {
            /* 一覧画面でエラー表示 */
          }
        }
        setAllowed(true);
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [isPublic, router]);

  if (!ready) return <p className="admin-loading">読み込み中…</p>;
  if (!allowed && !isPublic) return null;
  return <>{children}</>;
}
