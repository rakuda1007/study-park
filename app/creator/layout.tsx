import type { Metadata } from "next";
import { CreatorThemeProvider } from "@/components/creator/CreatorThemeProvider";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "クリエイター | Study Park",
  robots: { index: false, follow: false },
};

export default function CreatorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <CreatorThemeProvider>{children}</CreatorThemeProvider>;
}
