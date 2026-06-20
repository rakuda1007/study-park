import Link from "next/link";
import type { ReactNode } from "react";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export type PortalFeatureStep = {
  title: string;
  body: string;
};

export type PortalFeatureAction = {
  href: string;
  label: string;
  primary?: boolean;
  large?: boolean;
};

export type PortalFeatureDetailLayoutProps = {
  eyebrow: string;
  title: ReactNode;
  lead: string;
  image: { src: string; alt: string; width: number; height: number };
  features: string[];
  steps: PortalFeatureStep[];
  introActions: PortalFeatureAction[];
  closingTitle: string;
  closingBody: string;
  closingActions: PortalFeatureAction[];
};

export function PortalFeatureDetailLayout({
  eyebrow,
  title,
  lead,
  image,
  features,
  steps,
  introActions,
  closingTitle,
  closingBody,
  closingActions,
}: PortalFeatureDetailLayoutProps) {
  return (
    <div className="portal">
      <PortalHeader />

      <article className="portal-detail">
        <header className="portal-detail__header">
          <div className="portal-detail__header-inner">
            <p className="portal-detail__back-wrap">
              <Link href="/portal" className="portal-detail__back">
                ← ポータルに戻る
              </Link>
            </p>
            <p className="portal-eyebrow">{eyebrow}</p>
            <h1 className="portal-detail__title">{title}</h1>
            <p className="portal-detail__lead">{lead}</p>
            <div className="portal-detail__intro-actions">
              {introActions.map((action) => (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  className={`portal-btn${action.primary ? " portal-btn--primary" : " portal-btn--ghost"}${action.large ? " portal-btn--large" : ""}`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <div className="portal-detail__body">
          <section className="portal-detail-block">
            <div className="portal-detail-block__inner">
              <h2 className="portal-detail-block__heading">主な特徴</h2>
              <ul className="portal-detail-features">
                {features.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <div className="portal-detail__visual">
            <img
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="portal-detail__photo"
              loading="eager"
              decoding="async"
            />
          </div>

          <section className="portal-detail-block portal-detail-block--alt">
            <div className="portal-detail-block__inner">
              <h2 className="portal-detail-block__heading">使い方</h2>
              <ol className="portal-detail-steps">
                {steps.map((step, index) => (
                  <li key={step.title} className="portal-detail-step">
                    <span className="portal-detail-step__num" aria-hidden>
                      {index + 1}
                    </span>
                    <div className="portal-detail-step__content">
                      <h3 className="portal-detail-step__title">{step.title}</h3>
                      <p className="portal-detail-step__body">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>

        <section className="portal-closing portal-detail-closing">
          <div className="portal-closing__inner">
            <h2 className="portal-closing__title">{closingTitle}</h2>
            <p className="portal-closing__body">{closingBody}</p>
            <div className="portal-closing__actions">
              {closingActions.map((action) => (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  className={`portal-btn${action.primary ? " portal-btn--primary" : " portal-btn--ghost"}${action.large ? " portal-btn--large" : ""}`}
                >
                  {action.label}
                </Link>
              ))}
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
