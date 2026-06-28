"use client";

import { useAdminTheme } from "@/components/admin/AdminThemeProvider";
import type { AdminTheme } from "@/lib/admin/theme";
import { ShellHeader } from "@/components/shell/ShellHeader";
import { signOutAdmin } from "@/lib/firebase/auth-client";
import { useRouter } from "next/navigation";

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
      <ShellHeader
        ariaLabel="管理メニュー"
        logoutRedirect="/admin/login"
        onLogout={() => void logout()}
        menuFooter={
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
      {title ? <h2 className="shell-page-heading">{title}</h2> : null}
      {children}
    </div>
  );
}
