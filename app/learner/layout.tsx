import type { Metadata } from "next";
import { LearnerGate } from "@/components/learner/LearnerGate";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "学習者 | Study Park",
  robots: { index: false, follow: false },
};

export default function LearnerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="admin-root">
      <LearnerGate>{children}</LearnerGate>
    </div>
  );
}
