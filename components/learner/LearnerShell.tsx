"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { SessionModeSwitcher } from "@/components/auth/SessionModeSwitcher";
import { ShellBrandLink } from "@/components/shell/ShellBrandLink";
import { ShellHamburgerMenu } from "@/components/shell/ShellHamburgerMenu";
import { useShellSession } from "@/components/shell/useShellSession";
import { getShellMenu } from "@/lib/shell/menu-config";
import { signOutUser } from "@/lib/firebase/auth-client";

export function LearnerShell({
  title = "学習管理",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { ready, session, canSwitchMode, switchMode } = useShellSession();
  const menu = useMemo(
    () => (session ? getShellMenu(session) : { items: [], bottomItems: [] }),
    [session],
  );

  async function logout() {
    await signOutUser();
    router.replace("/");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header shell-header">
        <div className="shell-header__title-row">
          <h1 className="admin-title shell-header__title">
            <ShellBrandLink session={session} />
          </h1>
          {ready && session ? (
            <SessionModeSwitcher
              kind={session}
              canSwitch={canSwitchMode}
              onSwitch={switchMode}
            />
          ) : null}
        </div>
        <div className="shell-header__actions">
          <button type="button" className="admin-btn" onClick={() => void logout()}>
            ログアウト
          </button>
          <ShellHamburgerMenu
            items={menu.items}
            bottomItems={menu.bottomItems}
            ariaLabel="学習メニュー"
          />
        </div>
      </header>
      {title ? <h2 className="shell-page-heading">{title}</h2> : null}
      {children}
    </div>
  );
}
