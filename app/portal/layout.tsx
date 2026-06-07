import type { Metadata } from "next";
import "./portal.css";

export const metadata: Metadata = {
  title: "Study Park Portal",
  description:
    "覚えたい問題をその場でクイズに。あなた専用のデジタル問題集を、今すぐ作ろう。",
  openGraph: {
    title: "Study Park Portal",
    description: "覚えたい問題を、その場でクイズに。あなた専用のデジタル問題集を、今すぐ作ろう。",
    url: "https://study.tennis-park-community.com/portal",
  },
};

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
