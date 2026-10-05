import Link from "next/link";
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
            自分やお子様の学習を、
            <br />
            かんたんに管理しよう
          </h1>
        </div>
      </div>
      <div className="home-hero__below">
        <p className="home-hero__lead">
          Study Park
          は、自分やお子様の学習をかんたんに管理するアプリです。気になったところは自分で問題にして繰り返し解けます。学校や塾では、作った問題を生徒に届けることもできます。九九や県庁所在地は登録なしで今すぐ試せます。
        </p>
        <HomeGuestCtaLazy />
        <p className="home-hero__portal-link">
          <Link href="/portal" className="home-hero__cta-link">
            機能をもっと見る →
          </Link>
        </p>
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
        <div className="home-content" id="home-menu">
          <section className="home-free-zone" aria-labelledby="home-free-zone-heading">
            <h2 id="home-free-zone-heading" className="home-free-zone__title">
              無料で今すぐ試す
            </h2>
            <p className="home-free-zone__lead">
              登録なしで学べる公式コンテンツです。学習管理や問題づくりは、上のボタンから始められます。
            </p>
            <HomeNavLazy manifest={manifest} />
          </section>
        </div>
        <SiteFooter />
      </main>
    </HomePwaLanding>
  );
}
