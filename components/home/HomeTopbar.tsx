"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { SessionModeSwitcher } from "@/components/auth/SessionModeSwitcher";
import { ShellBrandLink } from "@/components/shell/ShellBrandLink";
import { ShellHamburgerMenu } from "@/components/shell/ShellHamburgerMenu";
import { useShellSession } from "@/components/shell/useShellSession";
import { getShellMenu } from "@/lib/shell/menu-config";
import { signOutUser } from "@/lib/firebase/auth-client";

export function HomeTopbar() {
  const router = useRouter();
  const { ready, session, canSwitchMode, switchMode } = useShellSession();
  const menu = useMemo(() => getShellMenu(session), [session]);

  async function logout() {
    await signOutUser();
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="home-topbar">
      <div className="home-topbar__inner home-topbar__header">
        <div className="home-topbar__title-row">
          <h1 className="home-topbar__title">
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
        <div className="home-topbar__actions">
          {!ready ? (
            <span className="home-topbar__auth-muted" role="status">
              …
            </span>
          ) : session ? (
            <button type="button" className="home-topbar__auth-btn" onClick={() => void logout()}>
              ログアウト
            </button>
          ) : (
            <Link href="/login" className="home-topbar__auth-btn">
              ログイン
            </Link>
          )}
          <ShellHamburgerMenu
            items={menu.items}
            bottomItems={menu.bottomItems}
            ariaLabel="Study Park メニュー"
          />
        </div>
      </div>
    </header>
  );
}
