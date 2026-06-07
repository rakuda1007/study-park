type Props = {
  title: string;
  lead: string;
  imageSrc?: string;
  children: React.ReactNode;
};

export function AuthSignupPageShell({
  title,
  lead,
  imageSrc = "/portal12.jpg",
  children,
}: Props) {
  return (
    <div className="auth-root auth-signup-form">
      <div className="auth-signup-hub__wrap">
        <div className="auth-signup-hub__hero">
          <img
            src={imageSrc}
            alt=""
            className="auth-signup-hub__hero-photo"
            width={960}
            height={480}
            decoding="async"
          />
          <div className="auth-signup-hub__hero-overlay" aria-hidden />
          <div className="auth-signup-hub__hero-copy">
            <p className="auth-signup-hub__eyebrow">STUDY PARK</p>
            <h1 className="auth-signup-hub__title">{title}</h1>
            <p className="auth-signup-hub__lead">{lead}</p>
          </div>
        </div>
        <div className="auth-signup-hub__body">{children}</div>
      </div>
    </div>
  );
}
