"use client";

import { CreatorShell } from "@/components/creator/CreatorShell";
import { CreatorUsageSection } from "@/components/creator/CreatorUsageSection";

export default function CreatorUsagePage() {
  return (
    <CreatorShell>
      <h2 className="shell-page-heading">利用状況</h2>
      <CreatorUsageSection />
    </CreatorShell>
  );
}
