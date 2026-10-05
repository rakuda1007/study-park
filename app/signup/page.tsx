import Link from "next/link";
import "../auth/auth.css";

export default function SignupHubPage() {
  return (
    <div className="auth-root auth-signup-hub">
      <div className="auth-signup-hub__wrap">
        <div className="auth-signup-hub__hero">
          <img
            src="/portal16.jpg"
            alt=""
            className="auth-signup-hub__hero-photo"
            width={960}
            height={480}
            decoding="async"
          />
          <div className="auth-signup-hub__hero-overlay" aria-hidden />
          <div className="auth-signup-hub__hero-copy">
            <p className="auth-signup-hub__eyebrow">STUDY PARK</p>
            <h1 className="auth-signup-hub__title">はじめる</h1>
            <p className="auth-signup-hub__lead">
              まずは学習管理から。必要になったら問題づくりや配信へ進めます。
            </p>
          </div>
        </div>

        <div className="auth-signup-hub__body">
          <div className="auth-role-grid">
            <Link href="/signup/learner" className="auth-role-card auth-role-card--primary">
              <strong>学習管理をはじめる</strong>
              <span>
                自分やお子様の学習計画・進捗を、同じアカウントでかんたんに管理できます。先生や塾から招待コードをもらっている場合も、こちらから参加できます。
              </span>
            </Link>
            <Link href="/signup/creator" className="auth-role-card">
              <strong>問題を作って配る</strong>
              <span>
                気になったところを自分で問題にして繰り返し解けます。学校や塾では、作った問題を生徒に届けることもできます。
              </span>
            </Link>
          </div>
          <p className="auth-links">
            すでにアカウントがある方は <Link href="/login">ログイン</Link>
            <br />
            <Link href="/#home-menu">まずは無料コンテンツを試す</Link>
            {" · "}
            <Link href="/">トップへ戻る</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
