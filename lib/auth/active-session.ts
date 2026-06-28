"use client";

import type { AuthSessionKind } from "@/lib/firebase/auth-client";

const STORAGE_KEY = "study-park-active-mode";
const CHANGE_EVENT = "study-park-active-mode-change";

export type DualRoleMode = Extract<AuthSessionKind, "admin" | "creator">;

export function getStoredActiveMode(): DualRoleMode | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(STORAGE_KEY);
  if (value === "admin" || value === "creator") return value;
  return null;
}

export function setStoredActiveMode(mode: DualRoleMode): void {
  sessionStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeActiveMode(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

/** 管理者かつクリエイター profile のとき、保存済みモード（未設定は creator） */
export function resolveDualRoleSession(isCreatorProfile: boolean): AuthSessionKind {
  if (!isCreatorProfile) return "admin";
  const stored = getStoredActiveMode();
  return stored === "admin" ? "admin" : "creator";
}

/** 管理・クリエイター画面ではアクティブモードをパスに合わせる（公園トップ `/` は変更しない） */
export function syncActiveModeWithPath(pathname: string): void {
  if (pathname === "/") return;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    setStoredActiveMode("admin");
    return;
  }
  if (pathname.startsWith("/creator")) {
    setStoredActiveMode("creator");
  }
}
