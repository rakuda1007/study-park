"use client";

import {
  CONTENT_PERIOD_FILTER_ALL,
  listContentPeriodOptions,
} from "@/lib/content/period";
import type { ContentDoc } from "@/lib/content/types";

type Props = {
  contents: ContentDoc[];
  value: string;
  onChange: (value: string) => void;
};

export function ContentPeriodFilter({ contents, value, onChange }: Props) {
  const options = listContentPeriodOptions(contents);

  return (
    <div className="admin-field admin-content-period-filter">
      <label htmlFor="content-period-filter">表示期間</label>
      <select
        id="content-period-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value={CONTENT_PERIOD_FILTER_ALL}>すべて</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
