import Link from "next/link";
import { PortalHeader } from "@/components/portal/PortalHeader";
import {
  PortalClosingActions,
  PortalHeroCta,
  PortalHeroNote,
} from "@/components/portal/PortalPageActions";
import { SiteFooter } from "@/components/site/SiteFooter";

const FEATURES = [
  {
    num: "01",
    title: "週ごとに見える、学習管理。計画・進捗・記録をひとつの画面で。",
    body: (
      <>
        科目ごとの学習計画をまとめて管理できます。
        今週の予定を一覧で確認し、進捗を記録。期限が近い項目や遅れている計画もひと目でわかるので、「何を・いつまでに・どこまで」が常にクリアです。
      </>
    ),
    bullets: [
      "学習計画を、週単位で一覧表示",
      "進捗が一目でわかる",
      "期限近・遅れをアラートでお知らせ",
    ],
    image: {
      src: "/portal10.jpg",
      alt: "GOAL・PLAN・ACTION の学習カード",
      width: 640,
      height: 427,
    },
    reverse: false,
    detailHref: "/portal/study-management",
  },
  {
    num: "02",
    title: "まずは暗記、仕上げはランダム。定着率を高める多彩な出題モード。",
    body: (
      <>
        学習のフェーズに合わせた最適なアプローチが可能です。
        最初は問題と答えをまとめて見てインプットし、慣れてきたら順番に挑戦したりランダム出題と、飽きずに繰り返せる仕組みを用意。
        間違えた苦手問題だけを集中して潰せるモードも搭載しています。
      </>
    ),
    bullets: [
      "学習段階に合わせた多彩な出題",
      "マンネリを防ぐ「ランダム出題モード」を搭載",
      "「間違えた問題だけ」で苦手を徹底克服",
    ],
    image: {
      src: "/portal8.jpg",
      alt: "ノートに電球のアイデアを描く様子",
      width: 640,
      height: 480,
    },
    reverse: true,
    detailHref: "/portal/quiz-modes",
  },
  {
    num: "03",
    title: "その場で登録、すぐに届ける。作る・解く・シェアがひとつにつながる。",
    body: (
      <>
        教科書や参考書を見ていて「覚えたい」「ここが出そう」と思ったその瞬間に登録できます。
        科目や単元ごとに自動で整理されるので、問題が増えても管理に困りません。
        できた教材は簡単にシェアできます。友達同士でクイズ感覚で競ったり、ご家庭で子供のために、塾や教室から生徒へ一斉配信することもできます。
      </>
    ),
    bullets: [
      "直感的な操作で簡単に問題を登録",
      "科目・単元ごとに分類し、スッキリ整理",
      "友達・家庭・教室まで、手軽に共有・配信",
    ],
    image: {
      src: "/portal11.jpg",
      alt: "海辺でジャンプする仲間たち",
      width: 640,
      height: 427,
    },
    reverse: false,
    detailHref: "/portal/create-and-share",
  },
];

export default function PortalPage() {
  return (
    <div className="portal">
      <PortalHeader />

      <section className="portal-hero">
        <div className="portal-hero__banner">
          <img
            src="/portal18.jpg"
            alt=""
            className="portal-hero__photo"
            width={640}
            height={480}
            decoding="async"
          />
          <div className="portal-hero__overlay" aria-hidden />
          <div className="portal-hero__copy-on-image">
            <p className="portal-eyebrow portal-eyebrow--on-image">STUDY PARK PORTAL</p>
            <h1 className="portal-hero__title portal-hero__title--on-image">
              覚えたい問題を、その場でクイズに。
              <br />
              あなた専用のデジタル問題集を、今すぐ作ろう。
            </h1>
            <PortalHeroCta />
          </div>
        </div>
        <div className="portal-hero__below">
          <p className="portal-hero__lead">
            教科書の重要ポイントや苦手な問題をサクッと登録。
            多彩な出題モードで定着させ、学習計画で進捗を管理。
            できたら友達や子供、生徒にシェアして届ける。
            もっと自由で、もっと効率的な新しい学びのカタチが、ここから始まります。
          </p>
          <PortalHeroNote />
        </div>
      </section>

      {FEATURES.map((feature) => (
        <section
          key={feature.num}
          className={`portal-feature${feature.reverse ? " portal-feature--reverse" : ""}`}
        >
          <div className="portal-feature__inner">
            <div className="portal-feature__visual">
              <img
                src={feature.image.src}
                alt={feature.image.alt}
                width={feature.image.width}
                height={feature.image.height}
                className="portal-feature__photo"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="portal-feature__copy">
              <p className="portal-feature__num">特徴 {feature.num}</p>
              <h2 className="portal-feature__title">{feature.title}</h2>
              <p className="portal-feature__body">{feature.body}</p>
              <ul className="portal-feature__list">
                {feature.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {feature.detailHref ? (
                <p className="portal-feature__more">
                  <Link href={feature.detailHref} className="portal-feature__more-link">
                    もっと詳しく →
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ))}

      <section className="portal-closing">
        <div className="portal-closing__inner">
          <h2 className="portal-closing__title">学びを、もっと前向きな時間に。</h2>
          <p className="portal-closing__body">
            Study Park は、ただの問題集アプリではありません。
            教材づくり、配信、復習、計画、達成感までつながるから、
            「教える人」と「学ぶ人」のどちらも、学習そのものに集中できます。
          </p>
          <PortalClosingActions />
        </div>
      </section>

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
