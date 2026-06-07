"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionModeBar } from "@/components/auth/SessionModeBar";
import { signOutUser } from "@/lib/firebase/auth-client";

export function LearnerShell({
  title = "あなたの学習",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await signOutUser();
    router.replace("/");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header admin-header--stacked">
        <div className="admin-header__lead">
          <SessionModeBar kind="learner" />
          <h1 className="admin-title">{title}</h1>
        </div>
        <nav className="admin-nav" aria-label="学習メニュー">
          <Link href="/?park=1" className="admin-link">
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
