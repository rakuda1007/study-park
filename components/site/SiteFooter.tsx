import Link from "next/link";
import "@/app/legal/legal.css";

const LEGAL_LINKS = [
  { href: "/about", label: "運営者情報" },
  { href: "/commerce-disclosure", label: "特定商取引法に基づく表記" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "利用規約" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

type Props = {
  variant?: "home" | "portal";
  children?: React.ReactNode;
};

export function SiteFooter({ variant = "home", children }: Props) {
  return (
    <footer className={`site-footer site-footer--${variant}`}>
      <div className="site-footer__inner">
        {children}
        <nav className="site-footer__legal" aria-label="法的情報">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="site-footer__link">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="site-footer__copy">© {new Date().getFullYear()} Study Park</p>
      </div>
    </footer>
  );
}
