import type { Metadata } from "next";
import Link from "next/link";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

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

const SECTIONS = [
  {
    title: "週ビューで、今週の学習がひと目でわかる",
    body: (
      <>
        学習管理のホーム画面では、今週に該当する学習計画だけを一覧表示します。科目ごとにまとまって見えるので、国語・算数・社会など、複数の勉強を並行していても迷いません。週を切り替えれば、先週の振り返りや来週の予定もすぐに確認できます。
      </>
    ),
    points: [
      "今週の計画件数と全体の進捗％をサマリー表示",
      "科目見出しごとに計画をグループ化",
      "完了・遅れ・期限近の件数をひと目で把握",
    ],
  },
  {
    title: "学習計画で「いつまでに・何を」を決める",
    body: (
      <>
        学習計画は、科目・開始日・期限・学習内容のセットです。1つの計画の中に、複数の教材や範囲を登録できます。テンプレートを使えば、よく使う構成を保存して、次回から素早く計画を作れます。
      </>
    ),
    points: [
      "科目・期間・メモを基本情報として登録",
      "1つの計画に、複数の学習内容（教材・範囲）を追加",
      "テンプレートで、定番の計画構成を再利用",
    ],
  },
  {
    title: "Study Park 教材も、その他教材も、同じ計画で",
    body: (
      <>
        参加中の Study Park 教材（クイズ・レッスン）は、教材を選んで対象範囲を書くだけで計画に追加できます。テキストや問題集など、Study Park 外の教材も名称と範囲を入力して同じ計画に混在させられます。科目に合わせて候補が絞り込まれるので、選びやすくなっています。
      </>
    ),
    points: [
      "Study Park 教材は一覧から選択（多い場合は検索モーダル）",
      "問題集・プリントなど外部教材も自由入力で登録",
      "計画の編集画面から、名称・範囲をあとから修正可能",
    ],
  },
  {
    title: "進捗％を記録し、達成感を可視化",
    body: (
      <>
        各学習内容ごとに進捗％を記録できます。科目全体の進捗は半円ゲージ、項目ごとはバーで表示され、どこまで終わったかがすぐにわかります。週ビューから「記録する」を選ぶと、該当計画の進捗入力画面に移動します。
      </>
    ),
    points: [
      "項目単位で進捗％を更新",
      "科目全体・各項目の進捗をグラフィカルに表示",
      "100％完了した計画は「完了」として表示",
    ],
  },
  {
    title: "よく使う項目で、入力をさらに短く",
    body: (
      <>
        「問題集」「漢字ドリル」「プリント」など、よく使う教材名をあらかじめ登録しておけます。学習計画を追加するときは、チップをタップするか入力補完から選ぶだけ。対象範囲の入力例（ページ・問など）も、項目ごとにヒントを設定できます。
      </>
    ),
    points: [
      "科目別に「よく使う項目」を登録・管理",
      "計画追加時にチップや入力補完で名称を反映",
      "対象範囲の入力例（ページ・問など）も項目ごとに設定可能",
    ],
  },
  {
    title: "期限近・遅れを見逃さない",
    body: (
      <>
        開始日と期限、現在の進捗から、計画の状態を自動判定します。期限が近い計画、進捗が遅れている計画を週サマリーや各カードで知らせるので、「気づいたら期限切れ」を防ぎやすくなります。
      </>
    ),
    points: [
      "週サマリーに「期限近」「遅れ」「完了」の件数を表示",
      "計画カードにステータスバッジを表示",
      "完了した計画では、遅れ表示を抑えて達成を強調",
    ],
  },
];

export default function PortalStudyManagementPage() {
  return (
    <div className="portal">
      <PortalHeader />

      <article className="portal-detail">
        <section className="portal-detail__hero">
          <div className="portal-detail__hero-inner">
            <div className="portal-detail__intro">
          <p className="portal-detail__back-wrap">
            <Link href="/portal" className="portal-detail__back">
              ← ポータルに戻る
            </Link>
          </p>
          <p className="portal-eyebrow">特徴 01 · 学習管理</p>
          <h1 className="portal-detail__title">
            週ごとに見える、学習管理。
            <br />
            計画・進捗・記録をひとつの画面で。
          </h1>
          <p className="portal-detail__lead">
            Study Park の学習管理は、学習者が「いつまでに・何を・どこまで」やったかを整理するための機能です。
            クイズで問題を解くだけでなく、テキストや問題集などの勉強も含めて、科目ごとの計画としてまとめて管理できます。
          </p>
          <div className="portal-detail__intro-actions">
            <Link href="/signup/learner" className="portal-btn portal-btn--primary">
              学習者として始める
            </Link>
            <Link href="/login" className="portal-btn portal-btn--ghost">
              ログイン
            </Link>
          </div>
            </div>

            <div className="portal-detail__visual">
              <img
                src="/portal10.jpg"
                alt="GOAL・PLAN・ACTION の学習カード"
                width={640}
                height={427}
                className="portal-detail__photo"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </section>

        {SECTIONS.map((section, index) => (
          <section
            key={section.title}
            className={`portal-detail-section${index % 2 === 1 ? " portal-detail-section--alt" : ""}`}
          >
            <div className="portal-detail-section__inner">
              <h2 className="portal-detail-section__title">{section.title}</h2>
              <p className="portal-detail-section__body">{section.body}</p>
              <ul className="portal-detail-section__list">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}

        <section className="portal-detail-flow">
          <div className="portal-detail-flow__inner">
            <h2 className="portal-detail-flow__title">基本的な使い方</h2>
            <ol className="portal-detail-flow__steps">
              <li>
                <strong>学習者登録</strong>
                <span>アカウントを作成し、参加中の教材を読み込みます。</span>
              </li>
              <li>
                <strong>学習計画を追加</strong>
                <span>科目・期間・教材（Study Park / その他）を登録します。</span>
              </li>
              <li>
                <strong>週ビューで確認</strong>
                <span>今週やるべき計画と進捗を一覧でチェックします。</span>
              </li>
              <li>
                <strong>進捗を記録</strong>
                <span>学習したら％を更新し、期限や遅れを確認します。</span>
              </li>
            </ol>
          </div>
        </section>

        <section className="portal-closing portal-detail-closing">
          <div className="portal-closing__inner">
            <h2 className="portal-closing__title">学びの計画から、記録まで。</h2>
            <p className="portal-closing__body">
              学習管理は、Study Park にログインした学習者が利用できます。
              教材を解くだけでなく、日々の勉強全体を見渡したい方におすすめです。
            </p>
            <div className="portal-closing__actions">
              <Link href="/signup/learner" className="portal-btn portal-btn--primary portal-btn--large">
                学習者登録（無料）
              </Link>
              <Link href="/learner/study" className="portal-btn portal-btn--ghost">
                学習管理を開く
              </Link>
              <Link href="/portal" className="portal-btn portal-btn--ghost">
                ポータルに戻る
              </Link>
            </div>
          </div>
        </section>
      </article>

      <SiteFooter variant="portal">
        <p className="site-footer__extra">
          Parkシリーズ全体を見る:{" "}
          <a
            href="https://trip.tennis-park-community.com/portal"
            target="_blank"
            rel="noopener noreferrer"
          >
            Trip Park 公式ポータル
          </a>
          {" · "}
          <Link href="/">Study Park トップ</Link>
          {" · "}
          <Link href="/login">ログイン</Link>
        </p>
      </SiteFooter>
    </div>
  );
}
