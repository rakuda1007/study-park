import Link from "next/link";
import { HomeNav } from "@/components/home/HomeNav";
import { HomeTopbar } from "@/components/home/HomeTopbar";
import { HomePwaLanding } from "@/components/home/HomePwaLanding";
import type { ContentManifest } from "@/lib/content/types";
import contentManifest from "@/public/content-manifest.json";

export default function Home() {
  const manifest = contentManifest as ContentManifest;

  return (
    <HomePwaLanding>
      <main className="home">
        <HomeTopbar />

        <section className="home-hero">
          <div className="home-hero__banner">
            <img
              src="/portal12.jpg"
              alt=""
              className="home-hero__photo"
              width={960}
              height={480}
              decoding="async"
            />
            <div className="home-hero__overlay" aria-hidden />
            <div className="home-hero__copy">
              <p className="home-eyebrow home-eyebrow--on-image">STUDY PARK</p>
              <h1 className="home-hero__title">
                さあ、あなた専用の
                <br />
                オリジナル問題集で学習を始めよう
              </h1>
            </div>
          </div>
          <div className="home-hero__below">
            <p className="home-hero__lead">
              好きなコンテンツを選んで、今日からスタート。九九や県庁所在地は登録なしで今すぐ学べます。
            </p>
            <p className="home-hero__note">
              教室の教材は
              <Link href="/signup/learner">学習者登録</Link>
              後に
              <Link href="/learner">学習者ホーム</Link>
              からどうぞ。
            </p>
          </div>
        </section>

        <div className="home-content">
          <HomeNav manifest={manifest} />
        </div>

      </main>
    </HomePwaLanding>
  );
}
