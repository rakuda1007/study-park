"use client";

import { FormEvent, useState } from "react";
import { joinWorkspaceByInviteCode } from "@/lib/workspaces/members";

type Props = {
  userId: string;
  onJoined: (workspaceName: string) => void;
};

export function JoinWorkspaceInviteForm({ userId, onJoined }: Props) {
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await joinWorkspaceByInviteCode(inviteCode, userId);
      setInviteCode("");
      setMessage(`「${result.workspaceName}」に参加しました。`);
      onJoined(result.workspaceName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "参加に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card learner-join-card" aria-labelledby="learner-join-heading">
      <h2 id="learner-join-heading" className="learner-join-card__title">
        別の教室に参加
      </h2>
      <p className="learner-join-card__lead">
        クリエイターから届いた招待コードを入力してください。クリエイターアカウントでも、同じメールアドレスで参加できます。
      </p>
      <form className="learner-join-form" onSubmit={(e) => void onSubmit(e)}>
        <label className="learner-join-form__label" htmlFor="learner-invite-code">
          招待コード
        </label>
        <div className="learner-join-form__row">
          <input
            id="learner-invite-code"
            className="learner-join-form__input"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="8文字のコード"
            required
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="admin-btn admin-btn--primary learner-join-form__btn" disabled={busy}>
            {busy ? "参加中…" : "参加する"}
          </button>
        </div>
      </form>
      {error ? <p className="admin-msg admin-msg--error">{error}</p> : null}
      {message ? <p className="admin-msg admin-msg--ok">{message}</p> : null}
    </section>
  );
}
