"use client";

import { useMemo } from "react";
import { useCreatorTheme } from "@/components/creator/CreatorThemeProvider";
import type { CreatorTheme } from "@/lib/creator/theme";
import { ShellHeader } from "@/components/shell/ShellHeader";

export function CreatorShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useCreatorTheme();

  return (
    <div className="admin-shell">
      <ShellHeader
        ariaLabel="クリエイターメニュー"
        logoutRedirect="/login"
        menuFooter={
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
      {children}
    </div>
  );
}
