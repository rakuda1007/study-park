"use client";

import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { SessionModeBar } from "@/components/auth/SessionModeBar";
import { signOutAdmin } from "@/lib/firebase/auth-client";

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await signOutAdmin();
    router.replace("/admin/login");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header admin-header--stacked">
        <div className="admin-header__lead">
          <SessionModeBar kind="admin" />
          <h1 className="admin-title">{title}</h1>
        </div>
        <AdminNav onLogout={() => void logout()} showThemeToggle />
      </header>
      {children}
      <footer className="admin-footer">
        <AdminNav onLogout={() => void logout()} />
      </footer>
    </div>
  );
}
