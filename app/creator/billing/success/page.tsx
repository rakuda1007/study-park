"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { syncCreatorBillingState } from "@/lib/billing/starter";
import { subscribeAuth } from "@/lib/firebase/auth-client";

function SuccessInner() {
  const params = useSearchParams();
  const kind = params.get("kind");
  const [msg, setMsg] = useState("決済結果を反映しています…");

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) {
          setMsg("ログインしてから再度お試しください。");
          return;
        }
        try {
          await syncCreatorBillingState(user.uid);
          setMsg(
            kind === "subscription"
              ? "月額プランの登録が完了しました（反映に数秒かかる場合があります）。"
              : "スターターの登録が完了しました（反映に数秒かかる場合があります）。",
          );
        } catch {
          setMsg("反映の確認に失敗しました。しばらく待ってから利用状況をご確認ください。");
        }
      })();
    });
    return unsub;
  }, [kind]);

  return (
    <CreatorShell>
      <h2 className="shell-page-heading">お支払い完了</h2>
      <section className="admin-card">
        <p>{msg}</p>
        <p style={{ marginTop: "1rem" }}>
          <Link href="/creator/usage" className="admin-link">
            利用状況を確認
          </Link>
          {" · "}
          <Link href="/creator" className="admin-link">
            ダッシュボードへ
          </Link>
        </p>
      </section>
    </CreatorShell>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<p className="admin-loading">読み込み中…</p>}>
      <SuccessInner />
    </Suspense>
  );
}
