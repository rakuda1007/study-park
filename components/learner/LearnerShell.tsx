"use client";

import { useRouter } from "next/navigation";
import { SessionModeBadge } from "@/components/auth/SessionModeBadge";
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
      <header className="admin-header shell-header">
        <div className="shell-header__title-row">
          <h1 className="admin-title shell-header__title">{title}</h1>
          <SessionModeBadge kind="learner" />
        </div>
        <nav className="admin-nav" aria-label="学習メニュー">
          <button type="button" className="admin-btn" onClick={() => void logout()}>
            ログアウト
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}
