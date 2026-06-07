"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthSignupPageShell } from "@/components/auth/AuthSignupPageShell";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { joinWorkspaceByInviteCode } from "@/lib/workspaces/members";
import { resolvePostLoginPath, signInWithEmail, signUpWithEmail } from "@/lib/firebase/auth-client";
import "../../auth/auth.css";

export default function SignupLearnerPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [joinMsg, setJoinMsg] = useState("");

  async function afterAuth(uid: string) {
    if (inviteCode.trim()) {
      const r = await joinWorkspaceByInviteCode(inviteCode, uid);
      setJoinMsg(`${r.workspaceName} に参加しました。`);
    }
    const path = await resolvePostLoginPath(uid);
    router.replace(path);
  }

  return (
    <AuthSignupPageShell
      title="招待コードで学習する　～学習者登録～"
      lead="招待コードと姓名を入力し、メールで登録またはログインしてください。"
    >
      <div className="auth-field">
        <label htmlFor="invite">
          招待コード
          <span className="auth-required" aria-hidden>
            必須
          </span>
        </label>
        <input
          id="invite"
          className="auth-input--code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="8文字のコード"
          required
        />
      </div>

      {mode === "signup" ? (
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
      ) : null}

      <p className="auth-mode-toggle">
        <button
          type="button"
          className="auth-mode-toggle__btn"
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}
        >
          {mode === "signup" ? "既にアカウントがある場合はログイン" : "新規登録に切り替え"}
        </button>
      </p>

      <EmailAuthForm
        embedded
        submitLabel={mode === "signup" ? "学習者として登録" : "ログインして参加"}
        onSubmit={async (email, password) => {
          if (mode === "signup") {
            if (!familyName.trim() || !givenName.trim()) {
              throw new Error("姓と名を入力してください。");
            }
            if (!inviteCode.trim()) {
              throw new Error("招待コードを入力してください。");
            }
          }
          const user =
            mode === "signup"
              ? await signUpWithEmail(email, password, "learner", {
                  familyName: familyName.trim(),
                  givenName: givenName.trim(),
                })
              : await signInWithEmail(email, password);
          await afterAuth(user.uid);
        }}
      />

      {joinMsg ? <p className="auth-msg--ok">{joinMsg}</p> : null}
      <p className="auth-links auth-links--center">
        <Link href="/signup">戻る</Link> · <Link href="/">トップへ</Link>
      </p>
    </AuthSignupPageShell>
  );
}
