import type { Metadata } from "next";
import Link from "next/link";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

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

const SECTIONS = [
  {
    title: "「ここが出そう」を、その場でクイズに",
    body: (
      <>
        教科書や参考書を見ていて「覚えたい」と思ったその瞬間に、問題を登録できます。問題文・答え・解説を入力するだけで、すぐにクイズ形式の教材になります。画像を添えることも可能で、図や表を使った問題にも対応しています。
      </>
    ),
    points: [
      "直感的な編集画面で、問題をスピード登録",
      "クイズ形式・レッスン形式など、用途に合わせて作成",
      "画像付き問題や、穴埋め形式にも対応",
    ],
  },
  {
    title: "科目・単元ごとに自動整理",
    body: (
      <>
        作った教材は、教科・科目・単元ごとに整理されます。問題が増えても、一覧からすぐに見つけられます。期間（作成年月）での絞り込みや、よく使う教材のピン留めなど、現場で使いやすい管理機能も備えています。
      </>
    ),
    points: [
      "教科・科目単位で教材を分類・管理",
      "一覧から編集・並べ替え・公開設定を変更",
      "問題数が増えても、探しやすい構成を維持",
    ],
  },
  {
    title: "招待コードで、学習者を招待",
    body: (
      <>
        ワークスペース（教室・個人の教材置き場）ごとに招待コードを発行できます。学習者はコードを入力するだけで、あなたの教材に参加。誰が参加しているかも管理画面から確認でき、塾や教室での運用にも向いています。
      </>
    ),
    points: [
      "招待コードを共有して、学習者を教材に参加させる",
      "参加者一覧で、誰が学習しているかを把握",
      "科目を公開すると、学習者ホームに教材が表示される",
    ],
  },
  {
    title: "URL・リンク共有で、手軽に届ける",
    body: (
      <>
        公開設定を「リンク共有」にすれば、ログインなしでも学習できる URL を発行できます。友達同士でクイズを競ったり、SNS や LINE で URL を送ったりと、気軽にシェアできます。限定公開・招待制など、用途に合わせた公開範囲も選べます。
      </>
    ),
    points: [
      "リンク共有で、URL ひとつで教材を届ける",
      "招待制・限定公開など、公開範囲を選べる",
      "友達同士のクイズ対決や、家庭での親製テストにも",
    ],
  },
  {
    title: "家庭・教室・友達——広がる活用シーン",
    body: (
      <>
        個人の弱点克服ノートとして使うのはもちろん、ご家庭ではお子様向けのオリジナルテストを、塾や教室では生徒への課題配信や復習教材として活用できます。作った教材は、Study Park の出題モードや学習管理と組み合わせて、学びの流れ全体を支えられます。
      </>
    ),
    points: [
      "個人メモから、教室の一斉配信まで幅広く対応",
      "お試しプラン（80問・100MB）ですぐに始められる",
      "作った教材は、学習者の学習計画にも組み込める",
    ],
  },
];

export default function PortalCreateAndSharePage() {
  return (
    <div className="portal">
      <PortalHeader />

      <article className="portal-detail">
        <div className="portal-detail__intro">
          <p className="portal-detail__back-wrap">
            <Link href="/portal" className="portal-detail__back">
              ← ポータルに戻る
            </Link>
          </p>
          <p className="portal-eyebrow">特徴 03 · 作成とシェア</p>
          <h1 className="portal-detail__title">
            その場で登録、すぐに届ける。
            <br />
            作る・解く・シェアがひとつにつながる。
          </h1>
          <p className="portal-detail__lead">
            Study Park は、問題を作って終わりではありません。
            その場で登録し、科目ごとに整理し、招待コードや URL で学習者に届ける——
            教材づくりから配信までを、ひとつの流れとして設計しています。
          </p>
          <div className="portal-detail__intro-actions">
            <Link href="/signup/creator" className="portal-btn portal-btn--primary">
              今すぐ教材をつくる（無料）
            </Link>
            <Link href="/signup/learner" className="portal-btn portal-btn--ghost">
              学習者として参加
            </Link>
          </div>
        </div>

        <div className="portal-detail__visual">
          <img
            src="/portal11.jpg"
            alt="海辺でジャンプする仲間たち"
            width={640}
            height={427}
            className="portal-detail__photo"
            loading="eager"
            decoding="async"
          />
        </div>

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
            <h2 className="portal-detail-flow__title">基本的な流れ</h2>
            <ol className="portal-detail-flow__steps">
              <li>
                <strong>クリエイター登録</strong>
                <span>無料のお試しプランで、教材の作成を始めます。</span>
              </li>
              <li>
                <strong>問題・教材を登録</strong>
                <span>科目を選び、問題やレッスンを追加します。</span>
              </li>
              <li>
                <strong>公開・共有</strong>
                <span>招待コードや URL で、学習者に届けます。</span>
              </li>
              <li>
                <strong>学習・復習</strong>
                <span>出題モードや学習管理と組み合わせて定着を支援します。</span>
              </li>
            </ol>
          </div>
        </section>

        <section className="portal-closing portal-detail-closing">
          <div className="portal-closing__inner">
            <h2 className="portal-closing__title">作った学びを、届けるところまで。</h2>
            <p className="portal-closing__body">
              クリエイター登録は無料のお試しプランから始められます。
              自分用の弱点ノートにも、教室の教材配信にも、同じ仕組みで使えます。
            </p>
            <div className="portal-closing__actions">
              <Link href="/signup/creator" className="portal-btn portal-btn--primary portal-btn--large">
                クリエイター登録（無料）
              </Link>
              <Link href="/creator" className="portal-btn portal-btn--ghost">
                クリエイター画面へ
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
