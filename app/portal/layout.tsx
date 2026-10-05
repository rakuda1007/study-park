import type { Metadata } from "next";
import "./portal.css";

export const metadata: Metadata = {
  title: "機能紹介 | Study Park",
  description:
    "学習管理、出題モード、問題の作成と配信など、Study Park の主な機能を紹介します。まずはトップの無料コンテンツから試せます。",
  alternates: {
    canonical: "/portal",
  },
  openGraph: {
    title: "機能紹介 | Study Park",
    description:
      "学習管理、出題モード、問題の作成と配信など、Study Park の主な機能を紹介します。",
    url: "/portal",
    siteName: "Study Park",
    type: "website",
  },
};

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
