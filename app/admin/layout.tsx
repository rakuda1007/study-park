import type { Metadata } from "next";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";
import "./admin.css";

export const metadata: Metadata = {
  title: "管理 | Study Park",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminThemeProvider>{children}</AdminThemeProvider>;
}
