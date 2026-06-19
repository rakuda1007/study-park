"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  appContentOptionKey,
  findAppContentOption,
  listAppContentsForSubject,
  STUDY_APP_CONTENT_INLINE_LIMIT,
  type StudyAppContentOption,
} from "@/lib/study/app-contents";
import { filterMastersForSubject } from "@/lib/study/masters-firestore";
import type { StudyContentRef, StudyItemDraft, StudyItemMasterDoc } from "@/lib/study/types";
import type { StudyWorkspaceOption } from "@/lib/study/subject-options";
import { StudyAppContentPicker } from "./StudyAppContentPicker";

type Props = {
  workspaces: StudyWorkspaceOption[];
  masters: StudyItemMasterDoc[];
  subjectId: string;
  onAdd: (item: StudyItemDraft) => void;
};

function contentToRef(
  option: StudyAppContentOption,
): StudyContentRef {
  const { workspaceId, workspaceSlug, content } = option;
  return {
    workspaceId,
    workspaceSlug,
    contentId: content.id,
    contentTitle: content.title,
    contentType: content.type,
    contentSlug: content.slug,
  };
}

function scopePlaceholder(unit?: string): string {
  if (unit === "ページ") return "例: p.12-20";
  if (unit === "問") return "例: 問1-10";
  if (unit) return `例: ${unit}を入力`;
  return "例: p.12-20、第3単元";
}

export function StudyItemAddPanel({ workspaces, masters, subjectId, onAdd }: Props) {
  const [externalLabel, setExternalLabel] = useState("");
  const [scopeNote, setScopeNote] = useState("");
  const [scopeHint, setScopeHint] = useState<string | undefined>();
  const [selectedAppKey, setSelectedAppKey] = useState("");
  const [inlineAppKey, setInlineAppKey] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [err, setErr] = useState("");

  const filterSubjectId = subjectId.startsWith("custom:") ? "" : subjectId;
  const availableMasters = useMemo(
    () => filterMastersForSubject(masters, filterSubjectId),
    [masters, filterSubjectId],
  );

  const appOptions = useMemo(
    () => listAppContentsForSubject(workspaces, subjectId),
    [workspaces, subjectId],
  );

  const useInlineAppPicker = appOptions.length <= STUDY_APP_CONTENT_INLINE_LIMIT;
  const selectedApp = findAppContentOption(
    appOptions,
    selectedAppKey || inlineAppKey,
  );

  useEffect(() => {
    setSelectedAppKey("");
    setInlineAppKey("");
    setExternalLabel("");
    setScopeNote("");
    setScopeHint(undefined);
    setErr("");
  }, [subjectId]);

  function clearAppSelection() {
    setSelectedAppKey("");
    setInlineAppKey("");
  }

  function pickApp(option: StudyAppContentOption) {
    setSelectedAppKey(appContentOptionKey(option));
    setInlineAppKey("");
    setExternalLabel("");
    setScopeHint(undefined);
    setPickerOpen(false);
    setErr("");
  }

  function handleInlineAppChange(key: string) {
    setInlineAppKey(key);
    setSelectedAppKey("");
    setExternalLabel("");
    setScopeHint(undefined);
    setErr("");
  }

  function applyMaster(master: StudyItemMasterDoc) {
    setExternalLabel(master.name);
    setScopeHint(master.defaultUnit);
    clearAppSelection();
    setErr("");
  }

  function resetRow() {
    setExternalLabel("");
    setScopeNote("");
    setScopeHint(undefined);
    clearAppSelection();
    setErr("");
  }

  function submit() {
    if (selectedApp) {
      if (!scopeNote.trim()) {
        setErr("対象範囲を入力してください。");
        return;
      }
      onAdd({
        source: "app",
        label: selectedApp.content.title,
        scopeNote: scopeNote.trim(),
        contentRef: contentToRef(selectedApp),
      });
      resetRow();
      return;
    }

    const label = externalLabel.trim();
    if (!label) {
      setErr("教材名を入力するか、Study Park の教材を選んでください。");
      return;
    }
    onAdd({
      source: "external",
      label,
      scopeNote: scopeNote.trim(),
    });
    resetRow();
  }

  const datalistId = `study-master-datalist-${filterSubjectId || "all"}`;

  return (
    <div className="study-item-add-row">
      {selectedApp ? (
        <div className="study-item-add-row__app-picked">
          <span className="study-item-add-row__app-badge">📱 Study Park</span>
          <span className="study-item-add-row__app-title">{selectedApp.content.title}</span>
          <span className="study-item-add-row__app-meta">
            {selectedApp.workspaceName}
          </span>
          <button
            type="button"
            className="study-item-add-row__app-clear"
            onClick={clearAppSelection}
            aria-label="選択を解除"
          >
            ×
          </button>
        </div>
      ) : (
        <>
          <label className="admin-field study-item-add-row__field">
            <span className="admin-label">教材名</span>
            <input
              className="admin-input"
              value={externalLabel}
              onChange={(e) => {
                setExternalLabel(e.target.value);
                setScopeHint(undefined);
                setErr("");
              }}
              list={availableMasters.length > 0 ? datalistId : undefined}
              placeholder="例: 問題集、プリント、漢字ドリル"
            />
            {availableMasters.length > 0 ? (
              <datalist id={datalistId}>
                {availableMasters.map((m) => (
                  <option key={m.id} value={m.name} />
                ))}
              </datalist>
            ) : null}
          </label>

          {availableMasters.length > 0 ? (
            <div className="study-item-add-row__chips">
              <span className="study-item-add-row__chips-label">よく使う:</span>
              {availableMasters.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="study-item-add-chip"
                  onClick={() => applyMaster(m)}
                >
                  {m.name}
                </button>
              ))}
              <Link href="/learner/study/masters" className="study-item-add-row__masters-link">
                管理
              </Link>
            </div>
          ) : (
            <p className="study-item-add-row__masters-hint">
              <Link href="/learner/study/masters" className="study-back-link">
                よく使う項目を登録すると次回から選べます →
              </Link>
            </p>
          )}

          {appOptions.length > 0 ? (
            <div className="study-item-add-row__app-pick">
              {useInlineAppPicker ? (
                <label className="admin-field study-item-add-row__field">
                  <span className="admin-label">Study Park の教材</span>
                  <select
                    className="admin-input"
                    value={inlineAppKey}
                    onChange={(e) => handleInlineAppChange(e.target.value)}
                  >
                    <option value="">選ばない</option>
                    {groupAppOptionsByWorkspace(appOptions).map(([wsName, items]) => (
                      <optgroup key={wsName} label={wsName}>
                        {items.map((option) => (
                          <option
                            key={appContentOptionKey(option)}
                            value={appContentOptionKey(option)}
                          >
                            {option.content.title}（
                            {option.content.type === "quiz" ? "クイズ" : "レッスン"}）
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              ) : (
                <button
                  type="button"
                  className="admin-btn study-item-add-row__app-open"
                  onClick={() => setPickerOpen(true)}
                >
                  📱 Study Park の教材を選ぶ（{appOptions.length}件）
                </button>
              )}
            </div>
          ) : null}
        </>
      )}

      <div className="study-item-add-row__bottom">
        <label className="admin-field study-item-add-row__scope">
          <span className="admin-label">対象範囲</span>
          <input
            className="admin-input"
            value={scopeNote}
            onChange={(e) => setScopeNote(e.target.value)}
            placeholder={
              selectedApp
                ? "例: 全問、第1章、問1-10"
                : scopePlaceholder(scopeHint)
            }
          />
        </label>
        <button
          type="button"
          className="admin-btn admin-btn--primary study-item-add-row__submit"
          onClick={submit}
        >
          追加
        </button>
      </div>

      {err ? <p className="admin-err">{err}</p> : null}

      {pickerOpen ? (
        <StudyAppContentPicker
          options={appOptions}
          onSelect={pickApp}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}

function groupAppOptionsByWorkspace(
  options: StudyAppContentOption[],
): [string, StudyAppContentOption[]][] {
  const map = new Map<string, StudyAppContentOption[]>();
  for (const option of options) {
    const list = map.get(option.workspaceName) ?? [];
    list.push(option);
    map.set(option.workspaceName, list);
  }
  return [...map.entries()];
}
