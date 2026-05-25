import Link from "next/link";
import "../auth/auth.css";

export default function SignupHubPage() {
  return (
    <div className="auth-root">
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 className="auth-title">新規登録</h1>
        <p className="auth-lead">利用する役割を選んでください。</p>
        <div className="auth-role-grid">
          <Link href="/signup/creator" className="auth-role-card">
            <strong>クリエイター（教材を作る）</strong>
            <span>問題・レッスンを作成して学習者に配信します。九九・県庁以外は買い切りが必要です。</span>
          </Link>
          <Link href="/signup/learner" className="auth-role-card">
            <strong>学習者</strong>
            <span>クリエイターから届いた招待コードで参加します。</span>
          </Link>
        </div>
        <p className="auth-links">
          すでにアカウントがある方は <Link href="/login">ログイン</Link>
          <br />
          <Link href="/">トップへ戻る</Link>
        </p>
      </div>
    </div>
  );
}
