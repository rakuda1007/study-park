"use client";

import { FormEvent, useEffect, useState } from "react";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { getUserProfile, updateUserProfile } from "@/lib/users/firestore";

export function AccountProfileForm() {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        setUid(user.uid);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setEmail(profile.email);
            setFamilyName(profile.familyName ?? "");
            setGivenName(profile.givenName ?? "");
          }
        } catch (e) {
          setErr(e instanceof Error ? e.message : "読み込みに失敗しました。");
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      await updateUserProfile(uid, { familyName, givenName });
      setMsg("プロフィールを保存しました。");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="admin-loading">読み込み中…</p>;
  }

  return (
    <>
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}
      {msg ? <p className="admin-msg admin-msg--ok">{msg}</p> : null}
      <form className="admin-card" onSubmit={(e) => void onSave(e)}>
        <div className="admin-field">
          <label htmlFor="profile-email">メールアドレス</label>
          <input id="profile-email" value={email} readOnly disabled />
        </div>
        <div className="admin-row">
          <div className="admin-field" style={{ flex: 1 }}>
            <label htmlFor="profile-family">姓</label>
            <input
              id="profile-family"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>
          <div className="admin-field" style={{ flex: 1 }}>
            <label htmlFor="profile-given">名</label>
            <input
              id="profile-given"
              value={givenName}
              onChange={(e) => setGivenName(e.target.value)}
              required
              autoComplete="given-name"
            />
          </div>
        </div>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "保存中…" : "保存"}
        </button>
      </form>
    </>
  );
}
