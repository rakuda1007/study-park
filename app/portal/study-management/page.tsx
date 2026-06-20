import type { Metadata } from "next";
import { PortalFeatureDetailLayout } from "@/components/portal/PortalFeatureDetailLayout";

export const metadata: Metadata = {
  title: "学習管理 | Study Park Portal",
  description:
    "科目ごとの学習計画、週単位の一覧、進捗記録、期限アラート。Study Park の学習管理機能を詳しく紹介します。",
  openGraph: {
    title: "学習管理 | Study Park Portal",
    description:
      "いつまでに何をやるか、どこまで進んだか。学習計画と進捗をひとつの画面で管理できます。",
    url: "https://study.tennis-park-community.com/portal/study-management",
  },
};

export default function PortalStudyManagementPage() {
  return (
    <PortalFeatureDetailLayout
      eyebrow="特徴 01 · 学習管理"
      title={
        <>
          週ごとに見える、学習管理。
          <br />
          計画・進捗・記録をひとつの画面で。
        </>
      }
      lead="Study Park の学習管理は、学習者が「いつまでに・何を・どこまで」やったかを整理するための機能です。クイズで問題を解くだけでなく、テキストや問題集などの勉強も含めて、科目ごとの計画としてまとめて管理できます。"
      image={{
        src: "/portal10.jpg",
        alt: "GOAL・PLAN・ACTION の学習カード",
        width: 640,
        height: 427,
      }}
      features={[
        "科目・期間・教材をセットにした学習計画を、週単位で一覧表示",
        "進捗％を記録し、期限近・遅れ・完了をひと目で把握",
        "Study Park 教材と外部教材を同じ計画で管理",
        "よく使う項目を登録して、計画追加を高速化",
        "テンプレートで、定番の計画構成を再利用",
        "計画の編集画面から、名称・範囲をあとから修正可能",
      ]}
      steps={[
        {
          title: "学習者登録",
          body: "アカウントを作成し、参加中の教材を読み込みます。学習管理はログインした学習者が利用できます。",
        },
        {
          title: "学習計画を追加",
          body: "科目・開始日・期限を設定し、Study Park の教材またはその他教材（問題集・プリントなど）を登録します。よく使う項目のチップから名称を選ぶこともできます。",
        },
        {
          title: "週ビューで確認",
          body: "学習管理のホーム画面で、今週の計画を科目ごとに一覧表示します。全体の進捗％や、期限近・遅れの件数もサマリーで確認できます。",
        },
        {
          title: "進捗を記録",
          body: "各計画の「記録する」から進捗％を更新します。100％完了した計画は「完了」として表示され、達成感を確認できます。",
        },
      ]}
      introActions={[
        { href: "/signup/learner", label: "学習者として始める", primary: true },
        { href: "/login", label: "ログイン" },
      ]}
      closingTitle="学びの計画から、記録まで。"
      closingBody="教材を解くだけでなく、日々の勉強全体を見渡したい方におすすめです。"
      closingActions={[
        { href: "/signup/learner", label: "学習者登録（無料）", primary: true, large: true },
        { href: "/learner/study", label: "学習管理を開く" },
        { href: "/portal", label: "ポータルに戻る" },
      ]}
    />
  );
}
