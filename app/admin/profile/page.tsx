"use client";

import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminProfilePage() {
  return (
    <AdminShell title="プロフィール">
      <AccountProfileForm />
    </AdminShell>
  );
}
