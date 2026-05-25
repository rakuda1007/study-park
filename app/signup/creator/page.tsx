"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { isValidWorkspaceSlug, normalizeWorkspaceSlug } from "@/lib/workspaces/slug";
import { resolvePostLoginPath, signUpWithEmail } from "@/lib/firebase/auth-client";
import "../../auth/auth.css";

export default function SignupCreatorPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("マイ教材");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [extraError, setExtraError] = useState("");

  function onSlugBlur() {
    if (!workspaceSlug.trim()) {
      setWorkspaceSlug(normalizeWorkspaceSlug(workspaceName) || "my-content");
    }
  }

  async function validateExtra(): Promise<{ workspaceName: string; workspaceSlug: string } | null> {
    const slug = normalizeWorkspaceSlug(workspaceSlug || workspaceName);
    if (!isValidWorkspaceSlug(slug)) {
      setExtraError("URL ID は英小文字・数字・ハイフン（2〜40文字）で指定してください。");
      return null;
    }
    setExtraError("");
    return { workspaceName: workspaceName.trim() || "マイ教材", workspaceSlug: slug };
  }

  return (
    <div className="auth-root">
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 className="auth-title">クリエイター登録</h1>
        <p className="auth-lead">
          メールでアカウントを作成します。教材 URL に使う ID も設定してください。
        </p>
        <EmailAuthForm
          submitLabel="アカウントを作成"
          onSubmit={async (email, password) => {
            const extra = await validateExtra();
            if (!extra) throw new Error(extraError || "入力を確認してください。");
            const user = await signUpWithEmail(email, password, "creator", {
              displayName,
              workspaceName: extra.workspaceName,
              workspaceSlug: extra.workspaceSlug,
            });
            const path = await resolvePostLoginPath(user.uid);
            router.replace(path);
          }}
        >
          {extraError ? <p className="auth-msg--error">{extraError}</p> : null}
          <div className="auth-field">
            <label htmlFor="displayName">表示名（任意）</label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="wsName">ワークスペース名</label>
            <input
              id="wsName"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="wsSlug">URL ID（例: yamada-class）</label>
            <input
              id="wsSlug"
              value={workspaceSlug}
              onChange={(e) => setWorkspaceSlug(e.target.value)}
              onBlur={onSlugBlur}
              placeholder="yamada-class"
            />
          </div>
        </EmailAuthForm>
        <p className="auth-links">
          <Link href="/signup">戻る</Link> · <Link href="/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
