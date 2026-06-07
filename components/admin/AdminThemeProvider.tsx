"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import {
  DEFAULT_ADMIN_THEME,
  readStoredAdminTheme,
  storeAdminTheme,
  type AdminTheme,
} from "@/lib/admin/theme";

type AdminThemeContextValue = {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function useAdminTheme(): AdminThemeContextValue {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return ctx;
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const [theme, setThemeState] = useState<AdminTheme>(DEFAULT_ADMIN_THEME);

  useEffect(() => {
    if (isLogin) {
      setThemeState(DEFAULT_ADMIN_THEME);
      return;
    }
    setThemeState(readStoredAdminTheme());
  }, [isLogin]);

  function setTheme(next: AdminTheme) {
    setThemeState(next);
    storeAdminTheme(next);
  }

  const displayTheme = isLogin ? DEFAULT_ADMIN_THEME : theme;
  const rootClass =
    displayTheme === "light" ? "admin-root admin-root--light" : "admin-root";

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme }}>
      <div className={rootClass} suppressHydrationWarning>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/shared/rich-text.css?v=3" />
        <AdminGate>{children}</AdminGate>
      </div>
    </AdminThemeContext.Provider>
  );
}
