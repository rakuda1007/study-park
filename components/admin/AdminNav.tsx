"use client";

import Link from "next/link";
import { useAdminTheme } from "@/components/admin/AdminThemeProvider";
import type { AdminTheme } from "@/lib/admin/theme";

type Props = {
  onLogout: () => void;
  showThemeToggle?: boolean;
};

export function AdminNav({ onLogout, showThemeToggle = false }: Props) {
  const { theme, setTheme } = useAdminTheme();

  return (
    <nav className="admin-nav" aria-label="管理メニュー">
      {showThemeToggle ? (
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
      ) : null}
      <Link href="/admin/contents" className="admin-link">
        コンテンツ一覧
      </Link>
      <Link href="/admin/invitations" className="admin-link">
        学習者招待
      </Link>
      <Link href="/admin/users" className="admin-link">
        利用者
      </Link>
      <Link href="/" className="admin-link" title="ログアウトせず公園トップを表示">
        Study Park トップ
      </Link>
      <button type="button" className="admin-btn" onClick={onLogout}>
        ログアウト
      </button>
    </nav>
  );
}
