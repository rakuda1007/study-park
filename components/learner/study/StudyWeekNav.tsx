"use client";

import { useState } from "react";
import {
  formatViewPeriodLabel,
  getPeriodStart,
  parseStudyViewInput,
  periodContains,
  shiftPeriod,
  STUDY_VIEW_INPUT_ERROR,
  usesWeekLabels,
  type StudyViewSettings,
} from "@/lib/study/view-period";
import { formatStudyDate } from "@/lib/study/week";

type Props = {
  periodStart: Date;
  settings: StudyViewSettings;
  editable: boolean;
  onChange: (periodStart: Date) => void;
  onSave: (input: { anchorDate: string; spanDays: number }) => Promise<void>;
  onReset: () => Promise<void>;
};

const SAVE_FAILED = "保存できませんでした。通信を確認してもう一度お試しください。";

export function StudyWeekNav({
  periodStart,
  settings,
  editable,
  onChange,
  onSave,
  onReset,
}: Props) {
  const weekLabels = usesWeekLabels(settings);
  const containsToday = periodContains(periodStart, settings.spanDays, new Date());
  const [open, setOpen] = useState(false);
  const [anchorInput, setAnchorInput] = useState("");
  const [spanInput, setSpanInput] = useState(String(settings.spanDays));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleSettings() {
    if (open) {
      setOpen(false);
      setError(null);
      return;
    }
    setAnchorInput(formatStudyDate(periodStart));
    setSpanInput(String(settings.spanDays));
    setError(null);
    setOpen(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseStudyViewInput(anchorInput, spanInput);
    if (!parsed) {
      setError(STUDY_VIEW_INPUT_ERROR);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(parsed);
      setOpen(false);
    } catch {
      setError(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    setError(null);
    try {
      await onReset();
      setOpen(false);
    } catch {
      setError(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="study-period">
      <div className="study-week-nav study-week-nav--compact">
        <button
          type="button"
          className="study-week-nav__btn"
          aria-label="前の期間"
          onClick={() => onChange(shiftPeriod(periodStart, settings.spanDays, -1))}
        >
          ◀
        </button>
        <div className="study-week-nav__label">
          <strong>{formatViewPeriodLabel(periodStart, settings.spanDays)}</strong>
          {containsToday ? (
            <span className="study-week-nav__tag">{weekLabels ? "今週" : "今日を含む"}</span>
          ) : (
            <button
              type="button"
              className="study-week-nav__jump"
              onClick={() => onChange(getPeriodStart(new Date(), settings))}
            >
              {weekLabels ? "今週へ" : "今日へ"}
            </button>
          )}
          <button
            type="button"
            className="study-week-nav__settings"
            aria-expanded={open}
            disabled={!editable || saving}
            onClick={toggleSettings}
          >
            期間を設定
          </button>
        </div>
        <button
          type="button"
          className="study-week-nav__btn"
          aria-label="次の期間"
          onClick={() => onChange(shiftPeriod(periodStart, settings.spanDays, 1))}
        >
          ▶
        </button>
      </div>

      {open ? (
        <form className="study-period-settings" aria-label="表示期間の設定" onSubmit={handleSave}>
          <div className="study-period-settings__dates">
            <label className="admin-field">
              <span className="admin-label">はじまりの日付</span>
              <input
                type="date"
                className="admin-input"
                value={anchorInput}
                disabled={saving}
                onChange={(event) => setAnchorInput(event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">表示日数</span>
              <input
                type="text"
                inputMode="numeric"
                className="admin-input"
                value={spanInput}
                disabled={saving}
                onChange={(event) => setSpanInput(event.target.value)}
              />
            </label>
          </div>
          {error ? (
            <p className="admin-msg admin-msg--error study-period-settings__error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="study-period-settings__actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              保存
            </button>
            <button
              type="button"
              className="admin-btn"
              disabled={saving}
              onClick={() => void handleReset()}
            >
              標準に戻す
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
