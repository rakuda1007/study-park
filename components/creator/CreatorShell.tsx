"use client";

import { useRouter } from "next/navigation";
import { SessionModeBadge } from "@/components/auth/SessionModeBadge";
import { ShellBrandLink } from "@/components/shell/ShellBrandLink";
import { ShellHamburgerMenu } from "@/components/shell/ShellHamburgerMenu";
import { PORTAL_MENU_ITEM } from "@/components/shell/portal-menu-item";
import { useCreatorTheme } from "@/components/creator/CreatorThemeProvider";
import type { CreatorTheme } from "@/lib/creator/theme";
import { signOutUser } from "@/lib/firebase/auth-client";

const CREATOR_MENU_MAIN = [
  { label: "トップ", href: "/", title: "Study Park トップ" },
  { label: "教科マスタ", href: "/creator/subjects" },
  { label: "参加者", href: "/creator/learners" },
  { label: "利用状況", href: "/creator/usage" },
  { label: "教材", href: "/learner/materials" },
  PORTAL_MENU_ITEM,
];

const CREATOR_MENU_BOTTOM = [{ label: "プロフィール", href: "/creator/profile" }];

export function CreatorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { theme, setTheme } = useCreatorTheme();

  async function logout() {
    await signOutUser();
    router.replace("/login");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header shell-header">
        <div className="shell-header__title-row">
          <h1 className="admin-title shell-header__title">
            <ShellBrandLink href="/" />
          </h1>
          <SessionModeBadge kind="creator" />
        </div>
        <div className="shell-header__actions">
          <button type="button" className="admin-btn" onClick={() => void logout()}>
            ログアウト
          </button>
          <ShellHamburgerMenu
            items={CREATOR_MENU_MAIN}
            bottomItems={CREATOR_MENU_BOTTOM}
            ariaLabel="クリエイターメニュー"
            footer={
              <label className="admin-theme-toggle" htmlFor="creator-theme">
                <span className="admin-theme-toggle__label">表示</span>
                <select
                  id="creator-theme"
                  className="admin-theme-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as CreatorTheme)}
                >
                  <option value="light">通常</option>
                  <option value="dark">ダーク</option>
                </select>
              </label>
            }
          />
        </div>
      </header>
      {children}
    </div>
  );
}
