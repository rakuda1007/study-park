import {
  HomeGuestCtaLazy,
  HomeNavLazy,
  HomeTopbarLazy,
} from "@/components/home/HomeLazy";
import { HomePwaLanding } from "@/components/home/HomePwaLanding";
import { SiteFooter } from "@/components/site/SiteFooter";
import type { ContentManifest } from "@/lib/content/types";
import contentManifest from "@/public/content-manifest.json";

function HomeHero() {
  return (
    <section className="home-hero">
      <div className="home-hero__banner">
        <picture>
          <source srcSet="/portal12.webp" type="image/webp" />
          <img
            src="/portal12.jpg"
            alt=""
            className="home-hero__photo"
            width={640}
            height={428}
            decoding="async"
            fetchPriority="high"
          />
        </picture>
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
        <HomeGuestCtaLazy />
      </div>
    </section>
  );
}

export default function Home() {
  const manifest = contentManifest as ContentManifest;

  return (
    <HomePwaLanding>
      <link rel="preload" as="image" href="/portal12.webp" type="image/webp" />
      <main className="home">
        <HomeTopbarLazy />
        <HomeHero />
        <div className="home-content">
          <HomeNavLazy manifest={manifest} />
        </div>
        <SiteFooter />
      </main>
    </HomePwaLanding>
  );
}
