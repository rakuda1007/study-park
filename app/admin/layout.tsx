import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/AdminGate";
import "./admin.css";

export const metadata: Metadata = {
  title: "管理 | Study Park",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="admin-root">
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/shared/rich-text.css?v=3" />
      <AdminGate>{children}</AdminGate>
    </div>
  );
}
