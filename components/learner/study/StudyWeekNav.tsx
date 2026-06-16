"use client";

import {
  addWeeks,
  formatWeekLabelCompact,
  getWeekStart,
} from "@/lib/study/week";

type Props = {
  weekStart: Date;
  onChange: (weekStart: Date) => void;
};

export function StudyWeekNav({ weekStart, onChange }: Props) {
  const currentWeekStart = getWeekStart(new Date());
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

  return (
    <div className="study-week-nav study-week-nav--compact">
      <button
        type="button"
        className="study-week-nav__btn"
        aria-label="前の週"
        onClick={() => onChange(addWeeks(weekStart, -1))}
      >
        ◀
      </button>
      <div className="study-week-nav__label">
        <strong>{formatWeekLabelCompact(weekStart)}</strong>
        {isCurrentWeek ? (
          <span className="study-week-nav__tag">今週</span>
        ) : (
          <button
            type="button"
            className="study-week-nav__jump"
            onClick={() => onChange(currentWeekStart)}
          >
            今週へ
          </button>
        )}
      </div>
      <button
        type="button"
        className="study-week-nav__btn"
        aria-label="次の週"
        onClick={() => onChange(addWeeks(weekStart, 1))}
      >
        ▶
      </button>
    </div>
  );
}
