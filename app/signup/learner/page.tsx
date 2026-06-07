"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <div className="auth-root">
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 className="auth-title">学習者</h1>
        <p className="auth-lead">
          招待コードと姓名を入力し、メールで登録またはログインしてください。
        </p>

        <div className="auth-field" style={{ marginBottom: "1rem" }}>
          <label htmlFor="invite">招待コード</label>
          <input
            id="invite"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="8文字のコード"
            required
            style={{
              width: "100%",
              padding: "0.6rem 0.75rem",
              border: "1px solid #c8cce8",
              borderRadius: 8,
              letterSpacing: "0.15em",
            }}
          />
        </div>

        {mode === "signup" ? (
          <div className="auth-row" style={{ marginBottom: "1rem" }}>
            <div className="auth-field" style={{ flex: 1 }}>
              <label htmlFor="familyName">姓</label>
              <input
                id="familyName"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>
            <div className="auth-field" style={{ flex: 1 }}>
              <label htmlFor="givenName">名</label>
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

        <p style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          <button
            type="button"
            className="auth-btn"
            style={{ background: "transparent", color: "#5058b8", padding: 0 }}
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          >
            {mode === "signup" ? "既にアカウントがある場合はログイン" : "新規登録に切り替え"}
          </button>
        </p>

        <EmailAuthForm
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
        {joinMsg ? <p style={{ color: "#067647", fontSize: "0.9rem" }}>{joinMsg}</p> : null}
        <p className="auth-links">
          <Link href="/signup">戻る</Link> · <Link href="/">トップへ</Link>
        </p>
      </div>
    </div>
  );
}
