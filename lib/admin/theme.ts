export type AdminTheme = "light" | "dark";

export const ADMIN_THEME_STORAGE_KEY = "study-park-admin-theme";

export const DEFAULT_ADMIN_THEME: AdminTheme = "light";

export function isAdminTheme(value: string | null | undefined): value is AdminTheme {
  return value === "light" || value === "dark";
}

export function readStoredAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return DEFAULT_ADMIN_THEME;
  try {
    const stored = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    return isAdminTheme(stored) ? stored : DEFAULT_ADMIN_THEME;
  } catch {
    return DEFAULT_ADMIN_THEME;
  }
}

export function storeAdminTheme(theme: AdminTheme): void {
  try {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
