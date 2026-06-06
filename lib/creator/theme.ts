export type CreatorTheme = "light" | "dark";

export const CREATOR_THEME_STORAGE_KEY = "study-park-creator-theme";

export const DEFAULT_CREATOR_THEME: CreatorTheme = "light";

export function isCreatorTheme(value: string | null | undefined): value is CreatorTheme {
  return value === "light" || value === "dark";
}

export function readStoredCreatorTheme(): CreatorTheme {
  if (typeof window === "undefined") return DEFAULT_CREATOR_THEME;
  try {
    const stored = localStorage.getItem(CREATOR_THEME_STORAGE_KEY);
    return isCreatorTheme(stored) ? stored : DEFAULT_CREATOR_THEME;
  } catch {
    return DEFAULT_CREATOR_THEME;
  }
}

export function storeCreatorTheme(theme: CreatorTheme): void {
  try {
    localStorage.setItem(CREATOR_THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
