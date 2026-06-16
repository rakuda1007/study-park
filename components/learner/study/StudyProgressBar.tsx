"use client";

import { delayStatusLabel, type StudyDelayStatus } from "@/lib/study/progress";

type Props = {
  percent: number;
  status?: StudyDelayStatus;
  label?: string;
  size?: "sm" | "md";
};

export function StudyProgressBar({ percent, status = "ok", label, size = "md" }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const statusLabel = delayStatusLabel(status);

  return (
    <div className={`study-progress study-progress--${size}`}>
      {(label || statusLabel) && (
        <div className="study-progress__header">
          {label ? <span className="study-progress__label">{label}</span> : <span />}
          {statusLabel ? (
            <span className={`study-progress__badge study-progress__badge--${status}`}>
              {statusLabel}
            </span>
          ) : null}
        </div>
      )}
      <div
        className={`study-progress__track study-progress__track--${status}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "進捗"}
      >
        <div className="study-progress__fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="study-progress__percent">{clamped}%</span>
    </div>
  );
}
