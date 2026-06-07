"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import { listMembersForWorkspace } from "@/lib/workspaces/members";

/** クリエイター向け：教材に参加している人数の概要 */
export function CreatorLearnerSummary({ compact = false }: { compact?: boolean }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) {
          setCount(null);
          return;
        }
        const ws = await getWorkspaceByOwner(user.uid);
        if (!ws) {
          setCount(0);
          return;
        }
        const members = await listMembersForWorkspace(ws.id);
        setCount(members.length);
      })();
    });
    return unsub;
  }, []);

  if (count === null) return null;

  if (compact) {
    return (
      <Link href="/creator/learners" className="session-mode-learner-chip">
        教材に参加している人: <strong>{count}人</strong>
      </Link>
    );
  }

  return (
    <p className="session-mode-learner-summary">
      教材に参加している人:{" "}
      <Link href="/creator/learners">
        <strong>{count}人</strong>
      </Link>
      {count === 0 ? (
        <span className="session-mode-learner-summary__note">
          {" "}
          — 招待コードを共有して参加を促せます
        </span>
      ) : null}
    </p>
  );
}
