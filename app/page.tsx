import { HomeNav } from "@/components/home/HomeNav";
import type { ContentManifest } from "@/lib/content/types";
import contentManifest from "@/public/content-manifest.json";

export default function Home() {
  const manifest = contentManifest as ContentManifest;

  return (
    <main className="home">
      <div className="home-caution" aria-hidden="true" />
      <div className="home-inner">
        <header className="home-header">
          <div className="home-brand">
            <div className="home-logo-wrap">
              <img
                src="/study-park-logo.png?v=8"
                alt=""
                width={68}
                height={68}
                className="home-logo"
                decoding="async"
              />
            </div>
            <div className="home-title-block">
              <p className="home-renovation-badge">
                <span aria-hidden="true">🚧</span> 改装中
              </p>
              <h1 className="home-title">Study Park</h1>
              <p className="home-lead">
                公園を少しずつ改装しています。できたエリアから遊んでね。
                教室の教材は
                <a href="/signup/learner" style={{ marginLeft: "0.25rem" }}>
                  学習者登録
                </a>
                後に
                <a href="/learner" style={{ marginLeft: "0.25rem" }}>
                  学習者ホーム
                </a>
                から。
              </p>
            </div>
          </div>
        </header>

        <HomeNav manifest={manifest} />

        <nav className="home-auth-nav" aria-label="アカウント">
          <a href="/login">ログイン</a>
          <a href="/signup/creator">教材を作る（クリエイター）</a>
          <a href="/signup/learner">学習者登録</a>
        </nav>
      </div>
    </main>
  );
}
