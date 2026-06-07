"use client";

import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { CreatorShell } from "@/components/creator/CreatorShell";

export default function CreatorProfilePage() {
  return (
    <CreatorShell>
      <h2 className="shell-page-heading">プロフィール</h2>
      <AccountProfileForm />
    </CreatorShell>
  );
}
