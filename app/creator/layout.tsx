import type { Metadata } from "next";
import { CreatorGate } from "@/components/creator/CreatorGate";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "クリエイター | Study Park",
  robots: { index: false, follow: false },
};

export default function CreatorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="admin-root">
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/shared/rich-text.css?v=3" />
      <CreatorGate>{children}</CreatorGate>
    </div>
  );
}
