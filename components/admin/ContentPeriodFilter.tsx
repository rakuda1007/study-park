"use client";

import { useEffect, useRef } from "react";
import {
  CONTENT_PERIOD_FILTER_ALL,
  contentPeriodRangeKey,
  contentPeriodYearOptions,
  currentContentPeriod,
  listContentPeriodOptions,
  parseContentPeriodKey,
  parseContentPeriodRangeKey,
  type ContentPeriod,
} from "@/lib/content/period";
import type { ContentDoc } from "@/lib/content/types";

type FilterMode = "all" | "period";

type Props = {
  contents: ContentDoc[];
  value: string;
  onChange: (value: string) => void;
  /** 指定時は選択を localStorage に保存 */
  storageKey?: string;
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function readStoredFilter(storageKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function storeFilter(storageKey: string, value: string): void {
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    /* ignore */
  }
}

function emitChange(
  onChange: (value: string) => void,
  storageKey: string | undefined,
  value: string,
): void {
  onChange(value);
  if (storageKey) storeFilter(storageKey, value);
}

function defaultRange(contents: ContentDoc[]): { start: ContentPeriod; end: ContentPeriod } {
  const existingOptions = listContentPeriodOptions(contents);
  const fallback = currentContentPeriod();
  const latest =
    existingOptions.length > 0
      ? parseContentPeriodKey(existingOptions[0].value) ?? fallback
      : fallback;
  return { start: latest, end: latest };
}

export function ContentPeriodFilter({ contents, value, onChange, storageKey }: Props) {
  const restored = useRef(false);
  const defaults = defaultRange(contents);
  const parsed =
    value === CONTENT_PERIOD_FILTER_ALL ? null : parseContentPeriodRangeKey(value);
  const mode: FilterMode = value === CONTENT_PERIOD_FILTER_ALL ? "all" : "period";
  const startYear = parsed?.start.year ?? defaults.start.year;
  const startMonth = parsed?.start.month ?? defaults.start.month;
  const endYear = parsed?.end.year ?? defaults.end.year;
  const endMonth = parsed?.end.month ?? defaults.end.month;
  const years = contentPeriodYearOptions();

  useEffect(() => {
    if (!storageKey || restored.current) return;
    restored.current = true;
    const stored = readStoredFilter(storageKey);
    if (stored && stored !== value) {
      onChange(stored);
    }
  }, [storageKey, value, onChange]);

  function emitRange(
    nextStart: ContentPeriod,
    nextEnd: ContentPeriod,
  ): void {
    emitChange(
      onChange,
      storageKey,
      contentPeriodRangeKey({ start: nextStart, end: nextEnd }),
    );
  }

  return (
    <div className="admin-content-period-filter" role="group" aria-label="表示期間">
      <div className="admin-field admin-content-period-filter__mode">
        <label htmlFor="content-period-mode">表示</label>
        <select
          id="content-period-mode"
          value={mode}
          onChange={(e) => {
            const nextMode = e.target.value as FilterMode;
            if (nextMode === "all") {
              emitChange(onChange, storageKey, CONTENT_PERIOD_FILTER_ALL);
              return;
            }
            emitRange(
              { year: startYear, month: startMonth },
              { year: endYear, month: endMonth },
            );
          }}
        >
          <option value="all">すべて</option>
          <option value="period">期間を指定</option>
        </select>
      </div>
      {mode === "period" ? (
        <>
          <div className="admin-content-period-filter__range">
            <span className="admin-content-period-filter__range-label">開始</span>
            <div className="admin-field admin-content-period-filter__part">
              <label htmlFor="content-period-start-year">年</label>
              <select
                id="content-period-start-year"
                value={startYear}
                onChange={(e) =>
                  emitRange(
                    { year: Number(e.target.value), month: startMonth },
                    { year: endYear, month: endMonth },
                  )
                }
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}年
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field admin-content-period-filter__part">
              <label htmlFor="content-period-start-month">月</label>
              <select
                id="content-period-start-month"
                value={startMonth}
                onChange={(e) =>
                  emitRange(
                    { year: startYear, month: Number(e.target.value) },
                    { year: endYear, month: endMonth },
                  )
                }
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}月
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-content-period-filter__range">
            <span className="admin-content-period-filter__range-label">終了</span>
            <div className="admin-field admin-content-period-filter__part">
              <label htmlFor="content-period-end-year">年</label>
              <select
                id="content-period-end-year"
                value={endYear}
                onChange={(e) =>
                  emitRange(
                    { year: startYear, month: startMonth },
                    { year: Number(e.target.value), month: endMonth },
                  )
                }
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}年
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field admin-content-period-filter__part">
              <label htmlFor="content-period-end-month">月</label>
              <select
                id="content-period-end-month"
                value={endMonth}
                onChange={(e) =>
                  emitRange(
                    { year: startYear, month: startMonth },
                    { year: endYear, month: Number(e.target.value) },
                  )
                }
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}月
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
