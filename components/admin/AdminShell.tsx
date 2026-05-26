"use client";

import Link from "next/link";
import { signOutAdmin } from "@/lib/firebase/auth-client";
import { useRouter } from "next/navigation";

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await signOutAdmin();
    router.replace("/admin/login");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <h1 className="admin-title">{title}</h1>
        <nav className="admin-nav" aria-label="管理メニュー">
          <Link href="/admin/contents" className="admin-link">
            コンテンツ一覧
          </Link>
          <Link href="/admin/invitations" className="admin-link">
            学習者招待
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
