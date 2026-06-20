import type { Metadata } from "next";
import Link from "next/link";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

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

const MODES = [
  {
    name: "順番に出題",
    desc: "問題1から順に挑戦。初めて覚えるときや、範囲を通しで復習したいときに向いています。",
  },
  {
    name: "ランダムに出題",
    desc: "出題順をシャッフル。順番に覚えてしまった「なんとなく正解」を防ぎ、実力試しに最適です。",
  },
  {
    name: "苦手問題を出題",
    desc: "間違えた問題だけを集中的に出題。弱点をピンポイントで潰せます。",
  },
  {
    name: "まとめて確認",
    desc: "問題と答えを一覧で見返せます。テスト前の総復習や、インプット段階の暗記に使えます。",
  },
];

const SECTIONS = [
  {
    title: "学習フェーズに合わせて、出題を切り替える",
    body: (
      <>
        Study Park のクイズは、プルダウンひとつで出題形式を選べます。最初は「まとめて確認」で全体像を把握し、慣れてきたら「順番に出題」、定着を確かめる段階では「ランダムに出題」、仕上げは「苦手問題を出題」——
        という流れで、同じ教材を何度も効率よく使い回せます。
      </>
    ),
    points: [
      "4つの出題モードを、教材ごとにワンタップで切り替え",
      "九九・県庁所在地など公式コンテンツでも同じ操作感",
      "クリエイター教材（ワークスペース）でも利用可能",
    ],
  },
  {
    title: "「見て覚える」から「解いて試す」まで",
    body: (
      <>
        まとめて確認モードでは、問題文と答えを一覧表示できます。ノート代わりに眺めて覚えたあと、順番出題で1問ずつ解き、ランダム出題で実力を試す——
        紙の問題集では面倒な「段階的な復習」を、デジタルならスムーズに続けられます。
      </>
    ),
    points: [
      "まとめて確認で、範囲全体を俯瞰してインプット",
      "順番出題で、1問ずつ丁寧に定着",
      "ランダム出題で、本当に覚えているかをチェック",
    ],
  },
  {
    title: "苦手問題に集中して、弱点を潰す",
    body: (
      <>
        間違えた問題は自動的に記録されます。苦手問題モードでは、その問題だけを繰り返し出題。得意な問題ばかり解いてしまう「復習の偏り」を防ぎ、本当に必要なところに時間を使えます。
      </>
    ),
    points: [
      "間違えた問題を記録し、苦手モードの対象に",
      "得意分野ばかり復習するムダを削減",
      "テスト前の仕上げや、弱点克服に集中",
    ],
  },
  {
    title: "続けやすい仕掛けで、モチベーションを維持",
    body: (
      <>
        連続正解数の表示や、達成時のフィードバックなど、学習を続けたくなる演出も用意しています。九九のような定番教材から、自分で作ったオリジナル問題集まで、同じ体験で楽しく繰り返せます。
      </>
    ),
    points: [
      "正解の連続（ストリーク）など、進捗が見える UI",
      "セッション終了時の達成感あるフィードバック",
      "スマートフォンでも使いやすい PWA 対応",
    ],
  },
];

export default function PortalQuizModesPage() {
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
          <p className="portal-eyebrow">特徴 02 · 出題モード</p>
          <h1 className="portal-detail__title">
            まずは暗記、仕上げはランダム。
            <br />
            定着率を高める多彩な出題モード。
          </h1>
          <p className="portal-detail__lead">
            Study Park のクイズは、ただ問題を解くだけではありません。
            覚える段階・試す段階・弱点克服の段階に合わせて、出題の仕方を変えられます。
            同じ教材を、何度も飽きずに効果的に使い回せます。
          </p>
          <div className="portal-detail__intro-actions">
            <Link href="/" className="portal-btn portal-btn--primary">
              無料コンテンツを試す
            </Link>
            <Link href="/signup/creator" className="portal-btn portal-btn--ghost">
              教材を作る
            </Link>
          </div>
        </div>

        <div className="portal-detail__visual">
          <img
            src="/portal8.jpg"
            alt="ノートに電球のアイデアを描く様子"
            width={640}
            height={480}
            className="portal-detail__photo"
            loading="eager"
            decoding="async"
          />
        </div>

        <section className="portal-detail-section portal-detail-section--alt">
          <div className="portal-detail-section__inner">
            <h2 className="portal-detail-section__title">4つの出題モード</h2>
            <ul className="portal-detail-modes">
              {MODES.map((mode) => (
                <li key={mode.name} className="portal-detail-mode">
                  <h3 className="portal-detail-mode__name">{mode.name}</h3>
                  <p className="portal-detail-mode__desc">{mode.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {SECTIONS.map((section, index) => (
          <section
            key={section.title}
            className={`portal-detail-section${index % 2 === 0 ? " portal-detail-section--alt" : ""}`}
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
            <h2 className="portal-detail-flow__title">おすすめの学び方</h2>
            <ol className="portal-detail-flow__steps">
              <li>
                <strong>まとめて確認</strong>
                <span>問題と答えを一覧で眺め、全体像をつかみます。</span>
              </li>
              <li>
                <strong>順番に出題</strong>
                <span>1問ずつ解いて、基本を定着させます。</span>
              </li>
              <li>
                <strong>ランダムに出題</strong>
                <span>順番に頼らず解き、本当の理解度を試します。</span>
              </li>
              <li>
                <strong>苦手問題を出題</strong>
                <span>間違えた問題だけを繰り返し、弱点を仕上げます。</span>
              </li>
            </ol>
          </div>
        </section>

        <section className="portal-closing portal-detail-closing">
          <div className="portal-closing__inner">
            <h2 className="portal-closing__title">覚える → 試す → 克服。</h2>
            <p className="portal-closing__body">
              九九・県庁所在地は登録なしで試せます。
              自分用の問題集を作れば、同じ出題モードでオリジナル教材にも使えます。
            </p>
            <div className="portal-closing__actions">
              <Link href="/" className="portal-btn portal-btn--primary portal-btn--large">
                学習メニューへ
              </Link>
              <Link href="/signup/creator" className="portal-btn portal-btn--ghost">
                教材を作る（無料）
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
