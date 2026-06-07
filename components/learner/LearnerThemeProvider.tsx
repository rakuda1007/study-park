"use client";

import { LearnerGate } from "@/components/learner/LearnerGate";

/** 学習者画面はデフォルトで通常（ライト）モード */
export function LearnerThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root admin-root--light" suppressHydrationWarning>
      <LearnerGate>{children}</LearnerGate>
    </div>
  );
}
