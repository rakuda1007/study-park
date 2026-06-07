"use client";

import { useRouter } from "next/navigation";
import { SessionModeBadge } from "@/components/auth/SessionModeBadge";
import { ShellHamburgerMenu } from "@/components/shell/ShellHamburgerMenu";
import { signOutUser } from "@/lib/firebase/auth-client";

const LEARNER_MENU_ITEMS = [
  { label: "トップ", href: "/", title: "Study Park トップ" },
  { label: "学習者ホーム", href: "/learner" },
  { label: "プロフィール", href: "/learner/profile" },
];

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
        <div className="shell-header__actions">
          <button type="button" className="admin-btn" onClick={() => void logout()}>
            ログアウト
          </button>
          <ShellHamburgerMenu items={LEARNER_MENU_ITEMS} ariaLabel="学習メニュー" />
        </div>
      </header>
      {children}
    </div>
  );
}
