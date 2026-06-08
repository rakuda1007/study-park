"use client";

import { useRouter } from "next/navigation";
import { SessionModeBadge } from "@/components/auth/SessionModeBadge";
import { ShellBrandLink } from "@/components/shell/ShellBrandLink";
import { ShellHamburgerMenu } from "@/components/shell/ShellHamburgerMenu";
import { PORTAL_MENU_ITEM } from "@/components/shell/portal-menu-item";
import { useAdminTheme } from "@/components/admin/AdminThemeProvider";
import type { AdminTheme } from "@/lib/admin/theme";
import { signOutAdmin } from "@/lib/firebase/auth-client";

const ADMIN_MENU_MAIN = [
  { label: "トップ", href: "/", title: "Study Park トップ" },
  { label: "コンテンツ一覧", href: "/admin/contents" },
  { label: "教科マスタ", href: "/admin/subjects" },
  { label: "学習者招待", href: "/admin/invitations" },
  { label: "利用者一覧", href: "/admin/users" },
  { label: "学習者ホーム", href: "/learner" },
  PORTAL_MENU_ITEM,
];

const ADMIN_MENU_BOTTOM = [{ label: "プロフィール", href: "/admin/profile" }];

export function AdminShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { theme, setTheme } = useAdminTheme();

  async function logout() {
    await signOutAdmin();
    router.replace("/admin/login");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header shell-header">
        <div className="shell-header__title-row">
          <h1 className="admin-title shell-header__title">
            <ShellBrandLink href="/" />
          </h1>
          <SessionModeBadge kind="admin" />
        </div>
        <div className="shell-header__actions">
          <button type="button" className="admin-btn" onClick={() => void logout()}>
            ログアウト
          </button>
          <ShellHamburgerMenu
            items={ADMIN_MENU_MAIN}
            bottomItems={ADMIN_MENU_BOTTOM}
            ariaLabel="管理メニュー"
            footer={
              <label className="admin-theme-toggle" htmlFor="admin-theme">
                <span className="admin-theme-toggle__label">表示</span>
                <select
                  id="admin-theme"
                  className="admin-theme-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as AdminTheme)}
                >
                  <option value="light">通常</option>
                  <option value="dark">ダーク</option>
                </select>
              </label>
            }
          />
        </div>
      </header>
      {title ? <h2 className="shell-page-heading">{title}</h2> : null}
      {children}
    </div>
  );
}
