import type { Metadata } from "next";
import { LearnerThemeProvider } from "@/components/learner/LearnerThemeProvider";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "学習者 | Study Park",
  robots: { index: false, follow: false },
};

export default function LearnerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <LearnerThemeProvider>{children}</LearnerThemeProvider>;
}
