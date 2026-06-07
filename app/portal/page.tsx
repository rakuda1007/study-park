import Link from "next/link";

const FEATURES = [
  {
    num: "01",
    title: "「ここが出そう」をその場で。自分だけの重要問題をサクサク簡単登録。",
    body: (
      <>
        教科書や参考書を見ていて「覚えたい」と思ったその瞬間に、迷わず問題を登録できます。
        科目や単元ごとに自動でスッキリ整理されるため、問題が増えても管理に困りません。
        自分だけの最強の弱点克服ノートが、驚くほどの手軽さで完成します。
      </>
    ),
    bullets: [
      "直感的な操作で、重要問題をいつでも簡単にスピード登録",
      "科目や単元ごとに分類できるから、大量の問題もスッキリ整理",
      "ノートをまとめる時間を減らし、解くための「勉強時間」を最大化",
    ],
    image: {
      src: "/portal8.jpg",
      alt: "ノートに電球のアイデアを描く様子",
      width: 640,
      height: 480,
    },
    reverse: false,
  },
  {
    num: "02",
    title: "まずは暗記、仕上げはランダム。定着率を高める多彩な出題モード。",
    body: (
      <>
        ただ問題を解くだけでなく、学習のフェーズに合わせた最適なアプローチが可能です。
        最初は問題と答えをまとめて見てインプットし、慣れてきたら順番に挑戦、実力試しにはランダム出題と、飽きずに繰り返せる仕組みを用意。
        さらに、間違えた苦手問題だけを集中して潰せるモードも搭載しています。
      </>
    ),
    bullets: [
      "「見て覚える」から「解いて試す」まで、段階に合わせた多彩な出題",
      "実力を正確に測り、マンネリを防ぐ「ランダム出題モード」を搭載",
      "「間違えた問題だけ」をピンポイントで復習し、苦手を徹底克服",
    ],
    image: {
      src: "/portal10.jpg",
      alt: "GOAL・PLAN・ACTION の学習カード",
      width: 640,
      height: 427,
    },
    reverse: true,
  },
  {
    num: "03",
    title: "友達との共有から、家庭学習、塾での一斉配信まで広がる活用シーン。",
    body: (
      <>
        作った問題は、自分一人で解くだけでなく、URLやコードを使って簡単にシェアできます。
        友達同士でクイズのように出し合って競うことはもちろん、ご家庭でお子様向けにオリジナルのテストを作ったり、塾や教室といった現場で生徒たちへ課題として一斉配信したりと、学びの輪をどこまでも広げられます。
      </>
    ),
    bullets: [
      "作った問題を友達にシェアして、お互いにクイズ感覚で楽しく切磋琢磨",
      "ご家庭でお子様の学習レベルに合わせた「親製テスト」を手軽に作成",
      "塾や教室の現場にも対応、生徒に向けた問題の一斉配信や教材配布が可能",
    ],
    image: {
      src: "/portal11.jpg",
      alt: "海辺でジャンプする仲間たち",
      width: 640,
      height: 427,
    },
    reverse: false,
  },
];

export default function PortalPage() {
  return (
    <div className="portal">
      <header className="portal-header">
        <div className="portal-header__inner">
          <Link href="/portal" className="portal-brand">
            <img
              src="/study-park-logo.png?v=8"
              alt=""
              width={40}
              height={40}
              className="portal-brand__logo"
              decoding="async"
            />
            <span className="portal-brand__name">Study Park</span>
          </Link>
          <nav className="portal-header-nav" aria-label="ポータルメニュー">
            <Link href="/login" className="portal-header-link">
              ログイン
            </Link>
            <Link href="/signup" className="portal-header-btn">
              新規登録
            </Link>
          </nav>
        </div>
      </header>

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
            <Link href="/signup/creator" className="portal-btn portal-btn--primary portal-btn--large">
              今すぐ教材をつくる（無料）
            </Link>
          </div>
        </div>
        <div className="portal-hero__below">
          <p className="portal-hero__lead">
            教科書の重要ポイントや苦手な問題をサクッと登録。
            まずは自分で解いて覚える。できたら友達や子供、生徒にシェアして届ける。
            もっと自由で、もっと効率的な新しい学びのカタチが、ここから始まります。
          </p>
          <p className="portal-hero__note">
            学習者の方は
            <Link href="/signup/learner"> こちらから参加</Link>
            。九九・県庁所在地など公式コンテンツは
            <Link href="/"> トップ</Link>
            から登録なしで学べます。
          </p>
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
            </div>
          </div>
        </section>
      ))}

      <section className="portal-closing">
        <div className="portal-closing__inner">
          <h2 className="portal-closing__title">学びを、もっと前向きな時間に。</h2>
          <p className="portal-closing__body">
            Study Park は、ただの問題集アプリではありません。
            教材づくり、配信、復習、達成感までつながるから、
            「教える人」と「学ぶ人」のどちらも、学習そのものに集中できます。
          </p>
          <div className="portal-closing__actions">
            <Link href="/signup" className="portal-btn portal-btn--primary portal-btn--large">
              今すぐ Study Park をはじめる（無料）
            </Link>
            <Link href="/" className="portal-btn portal-btn--ghost">
              学習メニューへ
            </Link>
          </div>
        </div>
      </section>

      <footer className="portal-footer">
        <p className="portal-footer__text">
          Parkシリーズ全体を見る:{" "}
          <a
            href="https://trip.tennis-park-community.com/portal"
            target="_blank"
            rel="noopener noreferrer"
          >
            Trip Park 公式ポータル
          </a>
        </p>
        <p className="portal-footer__copy">
          <Link href="/">Study Park トップ</Link>
          {" · "}
          <Link href="/login">ログイン</Link>
        </p>
      </footer>
    </div>
  );
}
