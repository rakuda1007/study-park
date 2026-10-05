import type { Metadata } from "next";
import "./portal.css";

export const metadata: Metadata = {
  title: "Study Park Portal",
  description:
    "自分やお子様の学習をかんたんに管理。気になったところは問題にして繰り返し解けます。学校や塾では生徒への配信も。",
  openGraph: {
    title: "Study Park Portal",
    description:
      "自分やお子様の学習をかんたんに管理。気になったところは問題にして繰り返し解けます。学校や塾では生徒への配信も。",
    url: "https://study.tennis-park-community.com/portal",
  },
};

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
