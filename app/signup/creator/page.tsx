"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { resolvePostLoginPath, signUpWithEmail } from "@/lib/firebase/auth-client";
import "../../auth/auth.css";

export default function SignupCreatorPage() {
  const router = useRouter();
  const [familyName, setFamilyName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("マイ教材");
  const [extraError, setExtraError] = useState("");

  function validateExtra(): { workspaceName: string; familyName: string; givenName: string } | null {
    const family = familyName.trim();
    const given = givenName.trim();
    if (!family || !given) {
      setExtraError("姓と名を入力してください。");
      return null;
    }
    const name = workspaceName.trim();
    if (!name) {
      setExtraError("ワークスペース名を入力してください。");
      return null;
    }
    setExtraError("");
    return { workspaceName: name, familyName: family, givenName: given };
  }

  return (
    <div className="auth-root">
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 className="auth-title">クリエイター登録</h1>
        <p className="auth-lead">
          メールでアカウントを作成します。姓名とワークスペース名はあとから変更できます。
        </p>
        <EmailAuthForm
          submitLabel="アカウントを作成"
          onSubmit={async (email, password) => {
            const extra = validateExtra();
            if (!extra) throw new Error(extraError || "入力を確認してください。");
            const user = await signUpWithEmail(email, password, "creator", {
              familyName: extra.familyName,
              givenName: extra.givenName,
              workspaceName: extra.workspaceName,
            });
            const path = await resolvePostLoginPath(user.uid);
            router.replace(path);
          }}
        >
          {extraError ? <p className="auth-msg--error">{extraError}</p> : null}
          <div className="auth-row">
            <div className="auth-field" style={{ flex: 1 }}>
              <label htmlFor="familyName">
                姓
                <span className="auth-required" aria-hidden>
                  必須
                </span>
              </label>
              <input
                id="familyName"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>
            <div className="auth-field" style={{ flex: 1 }}>
              <label htmlFor="givenName">
                名
                <span className="auth-required" aria-hidden>
                  必須
                </span>
              </label>
              <input
                id="givenName"
                value={givenName}
                onChange={(e) => setGivenName(e.target.value)}
                required
                autoComplete="given-name"
              />
            </div>
          </div>
          <p className="auth-hint" style={{ marginTop: "-0.35rem", marginBottom: "1rem" }}>
            管理画面の利用者一覧などに表示されるお名前です。
          </p>
          <div className="auth-field">
            <label htmlFor="wsName">
              ワークスペース名
              <span className="auth-required" aria-hidden>
                必須
              </span>
            </label>
            <input
              id="wsName"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              aria-describedby="wsName-hint"
              placeholder="例：山田クラス"
              required
            />
            <p id="wsName-hint" className="auth-hint">
              教材のまとまりの名前です。学習者の画面ではこの名前で表示されます。教材リンク用の URL ID
              は、登録時にここから自動で作成されます。
            </p>
          </div>
        </EmailAuthForm>
        <p className="auth-links">
          <Link href="/signup">戻る</Link> · <Link href="/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
