import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import "@/app/legal/legal.css";

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function LegalPage({ title, description, children }: Props) {
  return (
    <div className="legal-page">
      <header className="legal-page__header">
        <div className="legal-page__header-inner">
          <Link href="/" className="legal-page__brand">
            Study Park
          </Link>
          <Link href="/" className="legal-page__back">
            トップへ
          </Link>
        </div>
      </header>
      <main className="legal-page__main">
        <article className="legal-doc">
          <h1 className="legal-doc__title">{title}</h1>
          {description ? <p className="legal-doc__lead">{description}</p> : null}
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legal-doc__section">
      <h2 className="legal-doc__heading">{title}</h2>
      {children}
    </section>
  );
}
