"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  defaultStudySubjectOption,
  isCustomSubjectId,
  type StudySubjectData,
} from "@/lib/study/subject-options";
import type { StudyItemDraft, StudyItemMasterDoc, StudyPlanInput } from "@/lib/study/types";
import { todayStudyDate } from "@/lib/study/week";
import { StudyItemAddPanel } from "./StudyItemAddPanel";
import { StudyReadableText } from "./StudyReadableText";

type Props = {
  subjectData: StudySubjectData;
  masters?: StudyItemMasterDoc[];
  initial?: StudyPlanInput;
  submitLabel: string;
  onSubmit: (input: StudyPlanInput) => Promise<void>;
};

export function StudyPlanForm({
  subjectData,
  masters = [],
  initial,
  submitLabel,
  onSubmit,
}: Props) {
  const defaultSubject = defaultStudySubjectOption(subjectData.subjects);
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? defaultSubject.id);
  const [customSubjectName, setCustomSubjectName] = useState(
    initial && isCustomSubjectId(initial.subjectId) ? initial.subjectName : "",
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayStudyDate());
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? todayStudyDate());
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [items, setItems] = useState<StudyItemDraft[]>(
    initial?.items.length ? initial.items : [],
  );
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const resolvedSubjectId = useMemo(() => {
    if (isCustomSubjectId(subjectId)) return `custom:${customSubjectName.trim() || "その他"}`;
    return subjectId;
  }, [subjectId, customSubjectName]);

  const subjectName = useMemo(() => {
    if (isCustomSubjectId(subjectId)) return customSubjectName.trim();
    return subjectData.subjects.find((s) => s.id === subjectId)?.name ?? subjectId;
  }, [subjectId, customSubjectName, subjectData.subjects]);

  function addItem(item: StudyItemDraft) {
    setItems((prev) => [...prev, item]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<StudyItemDraft>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");

    if (!subjectName) {
      setErr("科目を選ぶか、名称を入力してください。");
      return;
    }
    if (startDate > dueDate) {
      setErr("期限は開始日以降にしてください。");
      return;
    }
    if (items.length === 0) {
      setErr("学習内容を1つ以上追加してください。");
      return;
    }
    if (items.some((item) => !item.label.trim())) {
      setErr("学習内容の名称を入力してください。");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        subjectId: isCustomSubjectId(subjectId) ? `custom:${subjectName}` : subjectId,
        subjectName,
        startDate,
        dueDate,
        memo: memo.trim() || undefined,
        items,
      });
    } catch (error) {
      setErr(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="study-plan-form" onSubmit={(e) => void handleSubmit(e)}>
      <section className="admin-card study-plan-form__section">
        <h2 className="study-plan-form__heading">基本情報</h2>
        <label className="admin-field">
          <span className="admin-label">科目</span>
          <select
            className="admin-input"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            {subjectData.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {isCustomSubjectId(subjectId) ? (
          <label className="admin-field">
            <span className="admin-label">科目名</span>
            <input
              className="admin-input"
              value={customSubjectName}
              onChange={(e) => setCustomSubjectName(e.target.value)}
              placeholder="例: 英語、塾の復習"
            />
          </label>
        ) : null}
        <div className="study-plan-form__dates">
          <label className="admin-field">
            <span className="admin-label">開始日</span>
            <input
              type="date"
              className="admin-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">期限</span>
            <input
              type="date"
              className="admin-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>
        <label className="admin-field">
          <span className="admin-label">メモ（任意）</span>
          <input
            className="admin-input"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="例: 期末テスト前"
          />
        </label>
      </section>

      <section className="admin-card study-plan-form__section">
        <h2 className="study-plan-form__heading">学習内容</h2>
        {items.length > 0 ? (
          <ul className="study-plan-form__item-list">
            {items.map((item, index) => (
              <li
                key={item.id ?? `draft-${index}`}
                className="study-plan-form__item-row study-plan-form__item-row--edit"
              >
                <div className="study-plan-form__item-fields">
                  <span className="study-plan-form__item-badge">
                    {item.source === "app" ? "📱 アプリ教材" : "📚 その他"}
                  </span>
                  {item.source === "external" ? (
                    <label className="admin-field study-plan-form__item-field">
                      <span className="admin-label">名称</span>
                      <input
                        className="admin-input"
                        value={item.label}
                        onChange={(e) => updateItem(index, { label: e.target.value })}
                        placeholder="例: テキスト、問題集"
                      />
                    </label>
                  ) : (
                    <p className="study-plan-form__item-title">
                      <StudyReadableText text={item.label} />
                    </p>
                  )}
                  <label className="admin-field study-plan-form__item-field">
                    <span className="admin-label">対象範囲</span>
                    <input
                      className="admin-input"
                      value={item.scopeNote}
                      onChange={(e) => updateItem(index, { scopeNote: e.target.value })}
                      placeholder={
                        item.source === "app"
                          ? "例: 全問、第1章"
                          : "例: p.12-20、第3単元"
                      }
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="admin-btn study-plan-form__remove"
                  onClick={() => removeItem(index)}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <StudyItemAddPanel
          workspaces={subjectData.workspaces}
          masters={masters}
          subjectId={resolvedSubjectId}
          onAdd={addItem}
        />
      </section>

      {err ? <p className="admin-err">{err}</p> : null}

      <div className="study-plan-form__submit">
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "保存中…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
