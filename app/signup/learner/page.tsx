"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { MultiFactorError } from "firebase/auth";
import { AuthSignupPageShell } from "@/components/auth/AuthSignupPageShell";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { TotpMfaChallenge } from "@/components/auth/TotpMfaChallenge";
import { joinWorkspaceByInviteCode } from "@/lib/workspaces/members";
import { InviteCodeInput } from "@/components/learner/InviteCodeInput";
import { resolvePostLoginPath, signInWithEmail, signUpWithEmail } from "@/lib/firebase/auth-client";
import "../../auth/auth.css";

export default function SignupLearnerPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [joinMsg, setJoinMsg] = useState("");
  const [mfaError, setMfaError] = useState<MultiFactorError | null>(null);

  async function afterAuth(uid: string) {
    if (inviteCode.trim()) {
      const r = await joinWorkspaceByInviteCode(inviteCode, uid);
      setJoinMsg(`${r.workspaceName} に参加しました。`);
      router.replace(`/learner/materials?joined=${encodeURIComponent(r.workspaceId)}`);
      return;
    }
    const path = await resolvePostLoginPath(uid);
    router.replace(path);
  }

  if (mfaError) {
    return (
      <AuthSignupPageShell title="二段階認証" lead="認証アプリの6桁コードを入力してください。">
        <TotpMfaChallenge
          mfaError={mfaError}
          onVerified={(user) => {
            void afterAuth(user.uid);
          }}
        />
        <p className="auth-links auth-links--center">
          <button type="button" className="auth-mode-toggle__btn" onClick={() => setMfaError(null)}>
            戻る
          </button>
        </p>
      </AuthSignupPageShell>
    );
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
        <InviteCodeInput
          id="invite"
          className="auth-input--code"
          value={inviteCode}
          onChange={setInviteCode}
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
          {mode === "signup"
            ? "既にアカウントがある場合はログイン（クリエイターアカウント可）"
            : "新規登録に切り替え"}
        </button>
      </p>

      <EmailAuthForm
        embedded
        submitLabel={mode === "signup" ? "学習者として登録" : "ログインして参加"}
        onMultiFactorRequired={mode === "login" ? setMfaError : undefined}
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
        {mode === "login" ? (
          <>
            <Link href="/login/forgot">パスワードをお忘れの方</Link>
            <br />
          </>
        ) : null}
        <Link href="/signup">戻る</Link> · <Link href="/">トップへ</Link>
      </p>
    </AuthSignupPageShell>
  );
}
