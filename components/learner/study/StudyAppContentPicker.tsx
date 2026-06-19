"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { StudyAppContentOption } from "@/lib/study/app-contents";

type Props = {
  options: StudyAppContentOption[];
  onSelect: (option: StudyAppContentOption) => void;
  onClose: () => void;
};

function contentTypeLabel(type: string): string {
  return type === "quiz" ? "クイズ" : "レッスン";
}

export function StudyAppContentPicker({ options, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const haystack = `${o.workspaceName} ${o.content.title}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, StudyAppContentOption[]>();
    for (const option of filtered) {
      const list = map.get(option.workspaceName) ?? [];
      list.push(option);
      map.set(option.workspaceName, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="study-app-picker-backdrop" onClick={onClose}>
      <div
        className="study-app-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-app-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="study-app-picker__head">
          <h3 id="study-app-picker-title" className="study-app-picker__title">
            Study Park の教材を選ぶ
          </h3>
          <button
            type="button"
            className="study-app-picker__close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <label className="admin-field study-app-picker__search">
          <span className="admin-label">検索</span>
          <input
            ref={searchRef}
            className="admin-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="教材名・教室名で絞り込み"
          />
        </label>

        <div className="study-app-picker__list">
          {filtered.length === 0 ? (
            <p className="admin-msg">該当する教材がありません。</p>
          ) : (
            grouped.map(([workspaceName, items]) => (
              <section key={workspaceName} className="study-app-picker__group">
                <h4 className="study-app-picker__group-title">{workspaceName}</h4>
                <ul className="study-app-picker__items">
                  {items.map((option) => (
                    <li key={`${option.workspaceId}:${option.content.id}`}>
                      <button
                        type="button"
                        className="study-app-picker__item"
                        onClick={() => onSelect(option)}
                      >
                        <span className="study-app-picker__item-title">
                          {option.content.title}
                        </span>
                        <span className="study-app-picker__item-meta">
                          {contentTypeLabel(option.content.type)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
