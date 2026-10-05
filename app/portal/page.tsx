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
    title: "自分やお子様の学習を、かんたんに管理。",
    body: (
      <>
        科目ごとの学習計画をまとめて管理できます。今週の予定を一覧で確認し、進捗を記録。
        期限が近い項目や遅れている計画もひと目でわかるので、「何を・いつまでに・どこまで」が常にクリアです。
        自分の勉強にも、お子様の学習サポートにも、同じアカウントで使えます。
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
    title: "気になったところは、自分で問題にして繰り返し解く。",
    body: (
      <>
        学習のフェーズに合わせた出題モードで定着を支援します。
        最初は問題と答えをまとめて見てインプットし、慣れてきたら順番やランダム出題で繰り返し練習。
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
    title: "学校や塾では、作った問題を生徒に届けることも。",
    body: (
      <>
        教科書や参考書を見ていて「覚えたい」「ここが出そう」と思った瞬間に登録できます。
        科目や単元ごとに整理されるので、問題が増えても管理に困りません。
        ご家庭での繰り返し練習にも、塾や教室から生徒への一斉配信にも使えます。
      </>
    ),
    bullets: [
      "直感的な操作で簡単に問題を登録",
      "科目・単元ごとに分類し、スッキリ整理",
      "家庭・教室まで、手軽に共有・配信",
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
            <p className="portal-eyebrow portal-eyebrow--on-image">STUDY PARK 機能紹介</p>
            <h1 className="portal-hero__title portal-hero__title--on-image">
              学習管理・出題・問題づくり
            </h1>
            <PortalHeroCta />
          </div>
        </div>
        <div className="portal-hero__below">
          <p className="portal-hero__lead">
            Study Park でできることを紹介します。自分やお子様の学習管理、繰り返し解ける出題、
            学校や塾での問題配信まで。まずはトップの無料コンテンツから試せます。
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
          <h2 className="portal-closing__title">学びの計画から、定着まで。</h2>
          <p className="portal-closing__body">
            まずは学習管理ではじめ、必要になったら問題づくりや配信へ。
            自分の勉強にも、お子様のサポートにも、教室での教材配信にも使えます。
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
          <Link href="/?park=1">無料で今すぐ試す</Link>
          {" · "}
          <Link href="/login">ログイン</Link>
        </p>
      </SiteFooter>
    </div>
  );
}
