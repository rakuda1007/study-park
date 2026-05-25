"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { resolvePostLoginPath, signInWithEmail } from "@/lib/firebase/auth-client";
import "../auth/auth.css";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="auth-root">
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 className="auth-title">ログイン</h1>
        <p className="auth-lead">Study Park アカウントでログインしてください。</p>
        <EmailAuthForm
          submitLabel="ログイン"
          onSubmit={async (email, password) => {
            const user = await signInWithEmail(email, password);
            const path = await resolvePostLoginPath(user.uid);
            router.replace(path);
          }}
        />
        <p className="auth-links">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup">新規登録</Link>
          <br />
          <Link href="/">トップへ戻る</Link>
        </p>
      </div>
    </div>
  );
}
