import type { Metadata } from "next";
import { PortalFeatureDetailLayout } from "@/components/portal/PortalFeatureDetailLayout";

export const metadata: Metadata = {
  title: "学習管理 | 機能紹介 | Study Park",
  description:
    "自分やお子様の学習計画、週単位の一覧、進捗記録、期限アラート。Study Park の学習管理機能を詳しく紹介します。",
  alternates: { canonical: "/portal/study-management" },
  openGraph: {
    title: "学習管理 | 機能紹介 | Study Park",
    description:
      "いつまでに何をやるか、どこまで進んだか。自分やお子様の学習をひとつの画面で管理できます。",
    url: "/portal/study-management",
  },
};

export default function PortalStudyManagementPage() {
  return (
    <PortalFeatureDetailLayout
      eyebrow="特徴 01 · 学習管理"
      title={
        <>
          自分やお子様の学習を、
          <br />
          かんたんに管理。
        </>
      }
      lead="Study Park の中心は学習管理です。「いつまでに・何を・どこまで」を整理し、自分の勉強にもお子様のサポートにも、同じアカウントで使えます。クイズだけでなく、テキストや問題集などの勉強も計画に含められます。"
      image={{
        src: "/portal10.jpg",
        alt: "GOAL・PLAN・ACTION の学習カード",
        width: 640,
        height: 427,
      }}
      features={[
        "学習計画を、週単位で一覧表示",
        "進捗が一目でわかる",
        "期限近・遅れをアラートでお知らせ",
      ]}
      steps={[
        {
          title: "学習管理をはじめる",
          body: "無料でアカウントを作成します。先生や塾から招待コードをもらっている場合は、登録時に入力すると教材にも参加できます。お子様の学習も、同じアカウントでまとめて管理できます。",
        },
        {
          title: "学習計画を作成",
          body: "科目・開始日・期限を設定し、アプリの教材またはアプリ外の勉強（問題集・プリントなど）を登録して計画を立てます。",
        },
        {
          title: "週ビューで確認し、進捗を記録",
          body: "今週の計画を科目ごとに一覧表示します。各計画の「記録する」から進捗％を更新し、完了した計画は達成感を確認できます。",
        },
      ]}
      introActions={[
        { href: "/signup/learner", label: "学習管理をはじめる（無料）", primary: true },
        { href: "/login", label: "ログイン" },
      ]}
      closingTitle="学びの計画から、記録まで。"
      closingBody="自分の勉強にも、お子様のサポートにも。まずは学習管理からはじめてください。"
      closingActions={[
        {
          href: "/signup/learner",
          label: "学習管理をはじめる（無料）",
          primary: true,
          large: true,
        },
        { href: "/learner", label: "学習管理を開く" },
        { href: "/portal", label: "機能紹介に戻る" },
      ]}
    />
  );
}
