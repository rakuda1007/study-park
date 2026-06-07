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
            <h1 className="auth-signup-hub__title">新規登録</h1>
            <p className="auth-signup-hub__lead">あなたに合った登録方法を選んでください。</p>
          </div>
        </div>

        <div className="auth-signup-hub__body">
          <div className="auth-role-grid">
            <Link href="/signup/creator" className="auth-role-card">
              <strong>自分で教材を作る</strong>
              <span>
                自分専用の問題集を作る。作った問題を自分で解くだけでなく、友達と共有することや、お子様用の問題を作ることもできます。また、塾や教室で生徒さんにも課題を一斉配信することもできます。
              </span>
            </Link>
            <Link href="/signup/learner" className="auth-role-card">
              <strong>招待コードで学習する</strong>
              <span>
                Study Park に招待された場合はこちらを選択してください。招待コードとお名前、メールアドレス、パスワードの登録ですぐに学習を始めることができます。
              </span>
            </Link>
          </div>
          <p className="auth-links">
            すでにアカウントがある方は <Link href="/login">ログイン</Link>
            <br />
            <Link href="/">トップへ戻る</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
