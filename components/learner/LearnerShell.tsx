"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SessionModeBadge } from "@/components/auth/SessionModeBadge";
import { ShellHamburgerMenu } from "@/components/shell/ShellHamburgerMenu";
import { PORTAL_MENU_ITEM } from "@/components/shell/portal-menu-item";
import {
  resolveAuthSession,
  signOutUser,
  subscribeAuth,
  type AuthSessionKind,
} from "@/lib/firebase/auth-client";

const LEARNER_MENU_MAIN = [
  { label: "トップ", href: "/", title: "Study Park トップ" },
  { label: "学習者ホーム", href: "/learner" },
  PORTAL_MENU_ITEM,
];

const LEARNER_MENU_BOTTOM = [{ label: "プロフィール", href: "/learner/profile" }];

export function LearnerShell({
  title = "あなたの学習",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [badgeKind, setBadgeKind] = useState<AuthSessionKind>("learner");

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void resolveAuthSession(user).then((kind) => {
        if (kind) setBadgeKind(kind);
      });
    });
    return unsub;
  }, []);

  async function logout() {
    await signOutUser();
    router.replace("/");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header shell-header">
        <div className="shell-header__title-row">
          <h1 className="admin-title shell-header__title">{title}</h1>
          <SessionModeBadge kind={badgeKind} />
        </div>
        <div className="shell-header__actions">
          <button type="button" className="admin-btn" onClick={() => void logout()}>
            ログアウト
          </button>
          <ShellHamburgerMenu
            items={LEARNER_MENU_MAIN}
            bottomItems={LEARNER_MENU_BOTTOM}
            ariaLabel="学習メニュー"
          />
        </div>
      </header>
      {children}
    </div>
  );
}
