import type { Metadata } from "next";
import { GuideReturnClient } from "./GuideReturnClient";

export const metadata: Metadata = {
  title: "アプリへ戻る",
  robots: { index: false, follow: false },
};

export default function GuideReturnPage() {
  return <GuideReturnClient />;
}
