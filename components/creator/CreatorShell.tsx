"use client";

import { ShellHeader } from "@/components/shell/ShellHeader";

export function CreatorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <ShellHeader ariaLabel="クリエイターメニュー" logoutRedirect="/login" />
      {children}
    </div>
  );
}
