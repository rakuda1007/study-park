import type { Metadata } from "next";
import { PortalFeatureDetailLayout } from "@/components/portal/PortalFeatureDetailLayout";

export const metadata: Metadata = {
  title: "教材の作成とシェア | Study Park Portal",
  description:
    "その場で問題を登録し、科目ごとに整理。招待コードや URL で友達・家庭・教室へ届けられます。",
  openGraph: {
    title: "教材の作成とシェア | Study Park Portal",
    description:
      "作る・解く・シェアがひとつにつながる。Study Park の教材作成と配信機能を詳しく紹介します。",
    url: "https://study.tennis-park-community.com/portal/create-and-share",
  },
};

export default function PortalCreateAndSharePage() {
  return (
    <PortalFeatureDetailLayout
      eyebrow="特徴 03 · 作成とシェア"
      title={
        <>
          その場で登録、すぐに届ける。
          <br />
          作る・解く・シェアがひとつにつながる。
        </>
      }
      lead="Study Park は、問題を作って終わりではありません。その場で登録し、科目ごとに整理し、招待コードや URL で学習者に届ける——教材づくりから配信までを、ひとつの流れとして設計しています。"
      image={{
        src: "/portal11.jpg",
        alt: "海辺でジャンプする仲間たち",
        width: 640,
        height: 427,
      }}
      features={[
        "教科書や参考書を見ながら、その場で問題をスピード登録",
        "科目・単元ごとに自動整理され、大量の問題もスッキリ管理",
        "クイズ形式・レッスン形式など、用途に合わせて作成",
        "招待コードで学習者を教材に参加させられる",
        "URL・リンク共有で、友達・家庭・教室へ手軽に届けられる",
        "作った教材は出題モードや学習管理と組み合わせて活用可能",
      ]}
      steps={[
        {
          title: "クリエイター登録",
          body: "無料のお試しプラン（80問・100MB）でアカウントを作成し、教材の作成を始めます。",
        },
        {
          title: "問題・教材を登録",
          body: "科目を選び、問題文・答え・解説を入力します。画像付き問題や穴埋め形式にも対応しています。",
        },
        {
          title: "公開・共有",
          body: "科目を公開し、招待コードを学習者に共有するか、リンク共有 URL を発行して届けます。",
        },
        {
          title: "学習・復習",
          body: "学習者は参加した教材をクイズ形式で学習します。出題モードや学習管理と組み合わせて、定着までサポートできます。",
        },
      ]}
      introActions={[
        { href: "/signup/creator", label: "今すぐ教材をつくる（無料）", primary: true },
        { href: "/signup/learner", label: "学習者として参加" },
      ]}
      closingTitle="作った学びを、届けるところまで。"
      closingBody="自分用の弱点ノートにも、教室の教材配信にも、同じ仕組みで使えます。"
      closingActions={[
        { href: "/signup/creator", label: "クリエイター登録（無料）", primary: true, large: true },
        { href: "/creator", label: "クリエイター画面へ" },
        { href: "/portal", label: "ポータルに戻る" },
      ]}
    />
  );
}
