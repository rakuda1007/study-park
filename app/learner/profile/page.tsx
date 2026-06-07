"use client";

import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { LearnerShell } from "@/components/learner/LearnerShell";
import { backfillLearnerNamesIfEmpty } from "@/lib/users/firestore";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { useEffect } from "react";

export default function LearnerProfilePage() {
  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      if (user) void backfillLearnerNamesIfEmpty(user.uid);
    });
    return unsub;
  }, []);

  return (
    <LearnerShell>
      <h2 className="shell-page-heading">プロフィール</h2>
      <AccountProfileForm />
    </LearnerShell>
  );
}
