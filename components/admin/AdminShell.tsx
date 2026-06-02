"use client";

import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
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
      <header className="admin-header">
        <h1 className="admin-title">{title}</h1>
        <AdminNav onLogout={() => void logout()} />
      </header>
      {children}
      <footer className="admin-footer">
        <AdminNav onLogout={() => void logout()} />
      </footer>
    </div>
  );
}
