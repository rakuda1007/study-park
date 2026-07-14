"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ShellHamburgerMenu } from "@/components/shell/ShellHamburgerMenu";
import { useShellSession } from "@/components/shell/useShellSession";
import { getShellMenu } from "@/lib/shell/menu-config";
import { signOutUser } from "@/lib/firebase/auth-client";

type Props = {
  ariaLabel?: string;
};

/** 再生画面ヘッダー用の三線メニュー（学習管理・教材一覧など） */
export function PlayAppMenu({ ariaLabel = "メニュー" }: Props) {
  const router = useRouter();
  const { ready, session } = useShellSession();
  const menu = useMemo(() => getShellMenu(session), [session]);

  async function logout() {
    await signOutUser();
    router.replace("/");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="app-header-menu app-header-menu--loading" aria-hidden>
        <span className="app-header-menu-placeholder" />
      </div>
    );
  }

  return (
    <div className="app-header-menu">
      <ShellHamburgerMenu
        items={menu.items}
        bottomItems={menu.bottomItems}
        ariaLabel={ariaLabel}
        onLogout={session ? () => void logout() : undefined}
      />
    </div>
  );
}
