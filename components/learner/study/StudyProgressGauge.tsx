"use client";

import { delayStatusLabel, type StudyDelayStatus } from "@/lib/study/progress";

type Props = {
  percent: number;
  status?: StudyDelayStatus;
  size?: "sm" | "md";
  hideBadge?: boolean;
};

const DIM = {
  sm: { width: 80, height: 50, r: 30, stroke: 5 },
  md: { width: 116, height: 72, r: 44, stroke: 6 },
} as const;

function polar(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy - r * Math.sin(angleRad),
  };
}

function percentAngle(percent: number) {
  return Math.PI * (1 - percent / 100);
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const from = polar(cx, cy, r, start);
  const to = polar(cx, cy, r, end);
  const large = start - end > Math.PI ? 1 : 0;
  return `M ${from.x} ${from.y} A ${r} ${r} 0 ${large} 1 ${to.x} ${to.y}`;
}

export function StudyProgressGauge({
  percent,
  status = "ok",
  size = "md",
  hideBadge = false,
}: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const complete = clamped >= 100;
  const visualStatus = complete ? "complete" : status;
  const statusLabel = hideBadge || complete ? null : delayStatusLabel(status);
  const dim = DIM[size];
  const cx = dim.width / 2;
  const cy = dim.height - 6;
  const needleEnd = polar(cx, cy, dim.r - 2, percentAngle(clamped));
  const valuePath =
    clamped > 0
      ? arcPath(cx, cy, dim.r, Math.PI, percentAngle(clamped))
      : "";

  return (
    <div
      className={`study-progress-gauge study-progress-gauge--${size} study-progress-gauge--${visualStatus}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="進捗"
    >
      {statusLabel ? (
        <span className={`study-progress-gauge__badge study-progress-gauge__badge--${status}`}>
          {statusLabel}
        </span>
      ) : null}
      <svg
        className="study-progress-gauge__svg"
        viewBox={`0 0 ${dim.width} ${dim.height}`}
        width={dim.width}
        height={dim.height}
        aria-hidden
      >
        <path
          className="study-progress-gauge__track"
          d={arcPath(cx, cy, dim.r, Math.PI, 0)}
          fill="none"
          strokeWidth={dim.stroke}
          strokeLinecap="round"
        />
        {valuePath ? (
          <path
            className="study-progress-gauge__value"
            d={valuePath}
            fill="none"
            strokeWidth={dim.stroke}
            strokeLinecap="round"
          />
        ) : null}
        <line
          className="study-progress-gauge__needle"
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          strokeWidth={size === "sm" ? 2 : 2.5}
          strokeLinecap="round"
        />
        <circle className="study-progress-gauge__hub" cx={cx} cy={cy} r={size === "sm" ? 3 : 4} />
      </svg>
      <span className="study-progress-gauge__label">
        {complete ? (
          <span className="study-progress-gauge__complete">完了</span>
        ) : (
          <span className="study-progress-gauge__percent">{clamped}%</span>
        )}
      </span>
    </div>
  );
}
