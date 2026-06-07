"use client";

import { useEffect, useRef } from "react";
import {
  CONTENT_PERIOD_FILTER_ALL,
  contentPeriodKey,
  contentPeriodYearOptions,
  currentContentPeriod,
  listContentPeriodOptions,
  parseContentPeriodKey,
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

export function ContentPeriodFilter({ contents, value, onChange, storageKey }: Props) {
  const restored = useRef(false);
  const existingOptions = listContentPeriodOptions(contents);
  const defaultPeriod =
    existingOptions.length > 0
      ? parseContentPeriodKey(existingOptions[0].value) ?? currentContentPeriod()
      : currentContentPeriod();
  const parsed =
    value === CONTENT_PERIOD_FILTER_ALL ? null : parseContentPeriodKey(value);
  const mode: FilterMode = value === CONTENT_PERIOD_FILTER_ALL ? "all" : "period";
  const year = parsed?.year ?? defaultPeriod.year;
  const month = parsed?.month ?? defaultPeriod.month;
  const years = contentPeriodYearOptions();

  useEffect(() => {
    if (!storageKey || restored.current) return;
    restored.current = true;
    const stored = readStoredFilter(storageKey);
    if (stored && stored !== value) {
      onChange(stored);
    }
  }, [storageKey, value, onChange]);

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
            emitChange(onChange, storageKey, contentPeriodKey({ year, month }));
          }}
        >
          <option value="all">すべて</option>
          <option value="period">期間を指定</option>
        </select>
      </div>
      {mode === "period" ? (
        <>
          <div className="admin-field admin-content-period-filter__part">
            <label htmlFor="content-period-filter-year">年</label>
            <select
              id="content-period-filter-year"
              value={year}
              onChange={(e) =>
                emitChange(
                  onChange,
                  storageKey,
                  contentPeriodKey({ year: Number(e.target.value), month }),
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
            <label htmlFor="content-period-filter-month">月</label>
            <select
              id="content-period-filter-month"
              value={month}
              onChange={(e) =>
                emitChange(
                  onChange,
                  storageKey,
                  contentPeriodKey({ year, month: Number(e.target.value) }),
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
        </>
      ) : null}
    </div>
  );
}
