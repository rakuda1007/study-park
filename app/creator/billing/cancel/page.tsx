"use client";

import Link from "next/link";
import { CreatorShell } from "@/components/creator/CreatorShell";

export default function BillingCancelPage() {
  return (
    <CreatorShell>
      <h2 className="shell-page-heading">お支払いをキャンセルしました</h2>
      <section className="admin-card">
        <p>決済は完了していません。いつでも利用状況ページから再度お試しください。</p>
        <p style={{ marginTop: "1rem" }}>
          <Link href="/creator/usage" className="admin-link">
            利用状況へ戻る
          </Link>
        </p>
      </section>
    </CreatorShell>
  );
}
