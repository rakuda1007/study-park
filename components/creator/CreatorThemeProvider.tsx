"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CreatorGate } from "@/components/creator/CreatorGate";
import {
  DEFAULT_CREATOR_THEME,
  readStoredCreatorTheme,
  storeCreatorTheme,
  type CreatorTheme,
} from "@/lib/creator/theme";

type CreatorThemeContextValue = {
  theme: CreatorTheme;
  setTheme: (theme: CreatorTheme) => void;
};

const CreatorThemeContext = createContext<CreatorThemeContextValue | null>(null);

export function useCreatorTheme(): CreatorThemeContextValue {
  const ctx = useContext(CreatorThemeContext);
  if (!ctx) {
    throw new Error("useCreatorTheme must be used within CreatorThemeProvider");
  }
  return ctx;
}

export function CreatorThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<CreatorTheme>(DEFAULT_CREATOR_THEME);

  useEffect(() => {
    setThemeState(readStoredCreatorTheme());
  }, []);

  function setTheme(next: CreatorTheme) {
    setThemeState(next);
    storeCreatorTheme(next);
  }

  const rootClass =
    theme === "light" ? "admin-root admin-root--light" : "admin-root";

  return (
    <CreatorThemeContext.Provider value={{ theme, setTheme }}>
      <div className={rootClass} suppressHydrationWarning>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/shared/rich-text.css?v=3" />
        <CreatorGate>{children}</CreatorGate>
      </div>
    </CreatorThemeContext.Provider>
  );
}
