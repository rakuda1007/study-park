"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { SessionModeSwitcher } from "@/components/auth/SessionModeSwitcher";
import { ShellBrandLink } from "@/components/shell/ShellBrandLink";
import { ShellHamburgerMenu } from "@/components/shell/ShellHamburgerMenu";
import { useShellSession } from "@/components/shell/useShellSession";
import { getShellMenu } from "@/lib/shell/menu-config";
import { signOutUser } from "@/lib/firebase/auth-client";

type Props = {
  ariaLabel: string;
  logoutRedirect?: string;
  onLogout?: () => void | Promise<void>;
  menuFooter?: React.ReactNode;
};

export function ShellHeader({
  ariaLabel,
  logoutRedirect = "/",
  onLogout,
  menuFooter,
}: Props) {
  const router = useRouter();
  const { ready, session, canSwitchMode, switchMode } = useShellSession();
  const menu = useMemo(
    () => (session ? getShellMenu(session) : { items: [], bottomItems: [] }),
    [session],
  );

  async function logout() {
    if (onLogout) {
      await onLogout();
      return;
    }
    await signOutUser();
    router.replace(logoutRedirect);
  }

  return (
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
        <ShellHamburgerMenu
          items={menu.items}
          bottomItems={menu.bottomItems}
          ariaLabel={ariaLabel}
          footer={menuFooter}
          onLogout={() => void logout()}
        />
      </div>
    </header>
  );
}
