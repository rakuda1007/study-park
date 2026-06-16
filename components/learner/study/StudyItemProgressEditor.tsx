"use client";

import Link from "next/link";
import { useState } from "react";
import { workspacePlayHref } from "@/lib/content/urls";
import { updateStudyItemProgress } from "@/lib/study/firestore";
import type { StudyItemDoc } from "@/lib/study/types";
import { StudyProgressBar } from "./StudyProgressBar";

type Props = {
  userId: string;
  planId: string;
  item: StudyItemDoc;
  onUpdated: (itemId: string, progressPercent: number) => void;
};

const PROGRESS_STEP = 5;

export function StudyItemProgressEditor({ userId, planId, item, onUpdated }: Props) {
  const [value, setValue] = useState(item.progressPercent);
  const [saving, setSaving] = useState(false);

  async function save(next: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(next)));
    setValue(clamped);
    setSaving(true);
    try {
      await updateStudyItemProgress(userId, planId, item.id, clamped);
      onUpdated(item.id, clamped);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="study-item-editor">
      <div className="study-item-editor__head">
        <div>
          <span className="study-item-editor__badge">
            {item.source === "app" ? "📱 Study Park" : "📚 その他"}
          </span>
          <h3 className="study-item-editor__title">{item.label}</h3>
          {item.scopeNote ? (
            <p className="study-item-editor__scope">{item.scopeNote}</p>
          ) : null}
        </div>
        {item.source === "app" && item.contentRef ? (
          <Link
            href={workspacePlayHref(
              item.contentRef.workspaceSlug,
              item.contentRef.contentSlug,
              item.contentRef.workspaceId,
              item.contentRef.contentId,
            )}
            className="study-item-editor__play"
          >
            学ぶ →
          </Link>
        ) : null}
      </div>

      <StudyProgressBar percent={value} size="md" />

      <div className="study-item-editor__controls">
        <input
          type="range"
          min={0}
          max={100}
          step={PROGRESS_STEP}
          value={value}
          className="study-item-editor__slider"
          onChange={(e) => setValue(Number(e.target.value))}
          onMouseUp={(e) => void save(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => void save(Number((e.target as HTMLInputElement).value))}
        />
        <div className="study-item-editor__adjust-row">
          <div className="study-item-editor__stepper">
            <button
              type="button"
              className="study-item-editor__step-btn"
              aria-label={`${PROGRESS_STEP}%減らす`}
              disabled={saving || value <= 0}
              onClick={() => void save(value - PROGRESS_STEP)}
            >
              −
            </button>
            <span className="study-item-editor__step-value">{value}%</span>
            <button
              type="button"
              className="study-item-editor__step-btn"
              aria-label={`${PROGRESS_STEP}%増やす`}
              disabled={saving || value >= 100}
              onClick={() => void save(value + PROGRESS_STEP)}
            >
              ＋
            </button>
          </div>
          <label className="study-item-editor__number">
            <span className="admin-label">進捗%</span>
            <input
              type="number"
              min={0}
              max={100}
              className="admin-input study-item-editor__percent-input"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              onBlur={() => void save(value)}
            />
          </label>
        </div>
        <div className="study-item-editor__quick">
          {[0, 25, 50, 75, 100].map((n) => (
            <button
              key={n}
              type="button"
              className="admin-btn study-item-editor__quick-btn"
              disabled={saving}
              onClick={() => void save(n)}
            >
              {n}%
            </button>
          ))}
        </div>
      </div>
    </li>
  );
}
