"use client";

import {
  addWeeks,
  formatWeekLabel,
  getWeekStart,
  todayStudyDate,
} from "@/lib/study/week";

type Props = {
  weekStart: Date;
  onChange: (weekStart: Date) => void;
};

export function StudyWeekNav({ weekStart, onChange }: Props) {
  const currentWeekStart = getWeekStart(new Date());
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

  return (
    <div className="study-week-nav">
      <button
        type="button"
        className="study-week-nav__btn"
        aria-label="前の週"
        onClick={() => onChange(addWeeks(weekStart, -1))}
      >
        ◀
      </button>
      <div className="study-week-nav__label">
        <strong>{formatWeekLabel(weekStart)}</strong>
        {!isCurrentWeek ? (
          <span className="study-week-nav__hint">表示中の週</span>
        ) : (
          <span className="study-week-nav__hint">今週</span>
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
      {!isCurrentWeek ? (
        <button
          type="button"
          className="admin-btn study-week-nav__today"
          onClick={() => onChange(currentWeekStart)}
        >
          今週
        </button>
      ) : null}
      <time className="study-week-nav__date" dateTime={todayStudyDate()}>
        今日: {todayStudyDate().replace(/-/g, "/")}
      </time>
    </div>
  );
}
