"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOutUser } from "@/lib/firebase/auth-client";

export function CreatorShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await signOutUser();
    router.replace("/login");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <h1 className="admin-title">{title}</h1>
        <nav className="admin-nav" aria-label="クリエイターメニュー">
          <Link href="/creator" className="admin-link">
            ダッシュボード
          </Link>
          <Link href="/creator/contents" className="admin-link">
            教材一覧
          </Link>
          <Link href="/creator/learners" className="admin-link">
            学習者
          </Link>
          <Link href="/" className="admin-link" title="ログアウトせず公園トップを表示">
            Study Park トップ
          </Link>
          <button type="button" className="admin-btn" onClick={() => void logout()}>
            ログアウト
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}
