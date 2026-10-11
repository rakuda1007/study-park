"use client";

import Link from "next/link";
import { useCreatorTheme } from "@/components/creator/CreatorThemeProvider";
import type { CreatorTheme } from "@/lib/creator/theme";

export function CreatorProfileSettings() {
  const { theme, setTheme } = useCreatorTheme();

  return (
    <section className="admin-card creator-profile-settings">
      <h3 className="admin-card__heading">設定</h3>
      <ul className="creator-profile-settings__links">
        <li>
          <Link href="/creator/usage" className="admin-link">
            プランと利用状況
          </Link>
        </li>
        <li>
          <Link href="/login" className="admin-link">
            別のアカウントでログイン
          </Link>
        </li>
      </ul>
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
    </section>
  );
}
