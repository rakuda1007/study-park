"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/users/firestore";
import { isAdminUser, subscribeAuth, waitForAuthReady } from "@/lib/firebase/auth-client";

export function LearnerGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    void waitForAuthReady().then(() => {
      if (cancelled) return;
      unsub = subscribeAuth(async (user) => {
        if (!user) {
          router.replace("/login?next=/learner");
          setAllowed(false);
          setReady(true);
          return;
        }
        const [profile, admin] = await Promise.all([
          getUserProfile(user.uid),
          isAdminUser(user),
        ]);
        const canPreview =
          admin || profile?.role === "learner" || profile?.role === "creator";
        if (!canPreview) {
          router.replace("/signup/learner");
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
  }, [router]);

  if (!ready) return <p className="admin-loading">読み込み中…</p>;
  if (!allowed) return null;
  return <>{children}</>;
}
