"use client";

import { FormEvent, useState } from "react";
import { createStudyTemplateFromPlan } from "@/lib/study/templates-firestore";
import type { StudyPlanWithItems } from "@/lib/study/types";

type Props = {
  userId: string;
  plan: StudyPlanWithItems;
  onSaved?: () => void;
};

export function StudySaveTemplateForm({ userId, plan, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${plan.subjectName}の計画`);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) {
      setErr("テンプレート名を入力してください。");
      return;
    }
    setSaving(true);
    try {
      await createStudyTemplateFromPlan(userId, plan, name.trim());
      setSaved(true);
      setOpen(false);
      onSaved?.();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return <p className="admin-msg admin-msg--ok">テンプレートを保存しました。</p>;
  }

  if (!open) {
    return (
      <button type="button" className="admin-btn" onClick={() => setOpen(true)}>
        テンプレートとして保存
      </button>
    );
  }

  return (
    <form className="study-save-template admin-card" onSubmit={(e) => void handleSubmit(e)}>
      <h3 className="study-save-template__title">テンプレートとして保存</h3>
      <p className="admin-msg">
        科目・学習内容・期間の長さを保存します。次回から同じ構成で計画を素早く作れます。
      </p>
      <label className="admin-field">
        <span className="admin-label">テンプレート名</span>
        <input
          className="admin-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 週末の算数セット"
        />
      </label>
      {err ? <p className="admin-err">{err}</p> : null}
      <div className="study-source-form__actions">
        <button type="button" className="admin-btn" onClick={() => setOpen(false)}>
          キャンセル
        </button>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "保存中…" : "保存する"}
        </button>
      </div>
    </form>
  );
}
