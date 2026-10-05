import type { Metadata } from "next";
import { PortalFeatureDetailLayout } from "@/components/portal/PortalFeatureDetailLayout";

export const metadata: Metadata = {
  title: "問題の作成と配信 | Study Park Portal",
  description:
    "気になったところを問題にして繰り返し解く。学校や塾では作った問題を生徒に届けられます。",
  openGraph: {
    title: "問題の作成と配信 | Study Park Portal",
    description:
      "定着のための問題づくりから、教室への配信まで。Study Park の作成・共有機能を紹介します。",
    url: "https://study.tennis-park-community.com/portal/create-and-share",
  },
};

export default function PortalCreateAndSharePage() {
  return (
    <PortalFeatureDetailLayout
      eyebrow="特徴 03 · 作成と配信"
      title={
        <>
          気になったところは問題にして繰り返し解く。
          <br />
          学校や塾では、生徒に届けることも。
        </>
      }
      lead="学習管理で計画を立てつつ、覚えたいポイントはその場で問題に登録できます。自分用の繰り返し練習にも、塾や教室から生徒への配信にも使えます。"
      image={{
        src: "/portal11.jpg",
        alt: "海辺でジャンプする仲間たち",
        width: 640,
        height: 427,
      }}
      features={[
        "教科書や参考書を見ながら、その場で問題をスピード登録",
        "科目・単元ごとに自動整理され、大量の問題もスッキリ管理",
        "招待コードやリンクで、家庭・教室へ手軽に届けられる",
      ]}
      steps={[
        {
          title: "クリエイター登録",
          body: "「問題を作って配る」から無料のお試しプラン（80問・100MB）でアカウントを作成します。",
        },
        {
          title: "問題・教材を登録",
          body: "科目を選び、問題文・答え・解説を入力します。画像付き問題や穴埋め形式にも対応しています。",
        },
        {
          title: "公開・共有",
          body: "科目を公開し、招待コードを学習者に共有するか、リンク共有 URL を発行して届けます。",
        },
      ]}
      introActions={[
        { href: "/signup/creator", label: "問題を作って配る（無料）", primary: true },
        { href: "/signup/learner", label: "学習管理をはじめる" },
      ]}
      closingTitle="作った学びを、届けるところまで。"
      closingBody="自分用の弱点ノートにも、教室の教材配信にも、同じ仕組みで使えます。"
      closingActions={[
        {
          href: "/signup/creator",
          label: "問題を作って配る（無料）",
          primary: true,
          large: true,
        },
        { href: "/creator", label: "クリエイター画面へ" },
        { href: "/portal", label: "ポータルに戻る" },
      ]}
    />
  );
}
