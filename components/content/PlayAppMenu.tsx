"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  ShellHamburgerMenu,
  type ShellMenuItem,
} from "@/components/shell/ShellHamburgerMenu";
import { useShellSession } from "@/components/shell/useShellSession";
import { getShellMenu } from "@/lib/shell/menu-config";
import { signOutUser } from "@/lib/firebase/auth-client";

type Props = {
  ariaLabel?: string;
  /** 学習中の教材切り替えパネルを開く */
  onPickMaterial?: () => void;
};

/** 再生画面ヘッダー用の三線メニュー（学習管理・教材一覧など） */
export function PlayAppMenu({ ariaLabel = "メニュー", onPickMaterial }: Props) {
  const router = useRouter();
  const { ready, session } = useShellSession();
  const menu = useMemo(() => {
    const base = getShellMenu(session);
    if (!onPickMaterial) return base;
    const pickItem: ShellMenuItem = {
      label: "教材を選ぶ",
      action: "pick-material",
      hint: "同じ教科のほかの教材に切り替え",
    };
    return {
      items: [pickItem, ...base.items],
      bottomItems: base.bottomItems,
    };
  }, [session, onPickMaterial]);

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
        onAction={(action) => {
          if (action === "pick-material") onPickMaterial?.();
        }}
      />
    </div>
  );
}
