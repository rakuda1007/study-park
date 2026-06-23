import type { Metadata } from "next";
import { PortalFeatureDetailLayout } from "@/components/portal/PortalFeatureDetailLayout";

export const metadata: Metadata = {
  title: "多彩な出題モード | Study Park Portal",
  description:
    "順番出題・ランダム・苦手問題・まとめて確認。Study Park のクイズ出題モードを詳しく紹介します。",
  openGraph: {
    title: "多彩な出題モード | Study Park Portal",
    description:
      "まずは暗記、仕上げはランダム。学習フェーズに合わせた出題で定着率を高めます。",
    url: "https://study.tennis-park-community.com/portal/quiz-modes",
  },
};

export default function PortalQuizModesPage() {
  return (
    <PortalFeatureDetailLayout
      eyebrow="特徴 02 · 出題モード"
      title={
        <>
          まずは暗記、仕上げはランダム。
          <br />
          定着率を高める多彩な出題モード。
        </>
      }
      lead="Study Park のクイズは、覚える段階・試す段階・弱点克服の段階に合わせて、出題の仕方を変えられます。プルダウンひとつで切り替えられる4つのモードで、同じ教材を何度も効率よく使い回せます。"
      image={{
        src: "/portal8.jpg",
        alt: "ノートに電球のアイデアを描く様子",
        width: 640,
        height: 480,
      }}
      features={[
        "順番に出題・ランダムに出題・苦手問題・まとめて確認の4モード",
        "「見て覚える」から「解いて試す」まで、段階に合わせた復習",
        "間違えた問題だけを集中的に出題し、弱点を克服",
      ]}
      steps={[
        {
          title: "教材を開いて出題形式を選ぶ",
          body: "トップページの九九・県庁所在地、または参加中のワークスペース教材から学びたいクイズを選びます。画面上部のプルダウンで「順番に出題」「ランダムに出題」「苦手問題を出題」「まとめて確認」のいずれかを選びます。",
        },
        {
          title: "学習フェーズに合わせて切り替える",
          body: "最初は「まとめて確認」で全体像を把握し、慣れたら「順番に出題」、定着確認は「ランダムに出題」、仕上げは「苦手問題を出題」と使い分けます。",
        },
        {
          title: "繰り返して定着させる",
          body: "間違えた問題は自動記録されます。苦手モードで弱点を潰し、セッションを重ねて定着度を高めます。",
        },
      ]}
      introActions={[
        { href: "/", label: "無料コンテンツを試す", primary: true },
        { href: "/signup/creator", label: "教材を作る" },
      ]}
      closingTitle="覚える → 試す → 克服。"
      closingBody="九九・県庁所在地は登録なしで試せます。自分用の問題集を作れば、同じ出題モードでオリジナル教材にも使えます。"
      closingActions={[
        { href: "/", label: "学習メニューへ", primary: true, large: true },
        { href: "/signup/creator", label: "教材を作る（無料）" },
        { href: "/portal", label: "ポータルに戻る" },
      ]}
    />
  );
}
