"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
    router.replace(path === "/signup" ? "/learner" : path);
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
      title="学習管理をはじめる"
      lead="自分やお子様の学習計画・進捗を、同じアカウントで管理できます。先生や塾から招待コードをもらっている場合は、あわせて入力してください。"
    >
      <div className="auth-field">
        <label htmlFor="invite">招待コード（任意）</label>
        <InviteCodeInput
          id="invite"
          className="auth-input--code"
          value={inviteCode}
          onChange={setInviteCode}
          placeholder="もらっている場合のみ入力"
        />
        <p className="auth-hint">
          空欄のままでも学習管理を利用できます。招待コードがある場合は、教材への参加も同時に行えます。
        </p>
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
            ? "既にアカウントがある場合はログイン"
            : "新規登録に切り替え"}
        </button>
      </p>

      <EmailAuthForm
        embedded
        submitLabel={
          mode === "signup"
            ? "学習管理をはじめる"
            : inviteCode.trim()
              ? "ログインして参加"
              : "ログイン"
        }
        onMultiFactorRequired={mode === "login" ? setMfaError : undefined}
        onSubmit={async (email, password) => {
          if (mode === "signup") {
            if (!familyName.trim() || !givenName.trim()) {
              throw new Error("姓と名を入力してください。");
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
        問題を作って配りたい方は <Link href="/signup/creator">こちら</Link>
        <br />
        <Link href="/signup">戻る</Link> · <Link href="/">トップへ</Link>
      </p>
    </AuthSignupPageShell>
  );
}
