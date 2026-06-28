"use client";

import { ShellHeader } from "@/components/shell/ShellHeader";

export function LearnerShell({
  title = "学習管理",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      <ShellHeader ariaLabel="学習メニュー" logoutRedirect="/" />
      {title ? <h2 className="shell-page-heading">{title}</h2> : null}
      {children}
    </div>
  );
}
