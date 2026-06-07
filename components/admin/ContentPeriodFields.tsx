"use client";

import { contentPeriodYearOptions } from "@/lib/content/period";

type Props = {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function ContentPeriodFields({ year, month, onYearChange, onMonthChange }: Props) {
  const years = contentPeriodYearOptions();

  return (
    <div className="admin-row">
      <div className="admin-field" style={{ flex: "1 1 8rem" }}>
        <label htmlFor="content-period-year">作成年月（年）</label>
        <select
          id="content-period-year"
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}年
            </option>
          ))}
        </select>
      </div>
      <div className="admin-field" style={{ flex: "1 1 8rem" }}>
        <label htmlFor="content-period-month">作成年月（月）</label>
        <select
          id="content-period-month"
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}月
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
