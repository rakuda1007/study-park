"use client";

import Link from "next/link";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  appContentOptionKey,
  findAppContentOption,
  listAppContentsForSubject,
  STUDY_APP_CONTENT_INLINE_LIMIT,
  type StudyAppContentOption,
} from "@/lib/study/app-contents";
import { filterMastersForSubject } from "@/lib/study/masters-firestore";
import { formatFromUnit, validateScopeNoteText } from "@/lib/study/scope-note";
import type { StudyContentRef, StudyItemDraft, StudyItemMasterDoc } from "@/lib/study/types";
import type { StudyWorkspaceOption } from "@/lib/study/subject-options";
import { StudyAppContentPicker } from "./StudyAppContentPicker";
import { StudyScopeNoteInput } from "./StudyScopeNoteInput";

type Props = {
  workspaces: StudyWorkspaceOption[];
  masters: StudyItemMasterDoc[];
  subjectId: string;
  onAdd: (item: StudyItemDraft) => void;
};

export type StudyItemAddPanelHandle = {
  /**
   * 未「リストに追加」の入力を取り出す。
   * - item: 取り出せた下書き（空欄のみなら null）
   * - error: 途中入力で完了できないとき
   */
  consumePending: () => { item: StudyItemDraft | null; error?: string };
};

function contentToRef(option: StudyAppContentOption): StudyContentRef {
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

export const StudyItemAddPanel = forwardRef<StudyItemAddPanelHandle, Props>(
  function StudyItemAddPanel({ workspaces, masters, subjectId, onAdd }, ref) {
    const [externalLabel, setExternalLabel] = useState("");
    const [scopeNote, setScopeNote] = useState("");
    const [scopeHint, setScopeHint] = useState<string | undefined>();
    const [scopeResetKey, setScopeResetKey] = useState(0);
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

    const preferredFormat = selectedApp ? "free" : formatFromUnit(scopeHint);

    useEffect(() => {
      setSelectedAppKey("");
      setInlineAppKey("");
      setExternalLabel("");
      setScopeNote("");
      setScopeHint(undefined);
      setScopeResetKey((k) => k + 1);
      setErr("");
    }, [subjectId]);

    function clearAppSelection() {
      setSelectedAppKey("");
      setInlineAppKey("");
    }

    function bumpScope(nextHint?: string) {
      setScopeNote("");
      setScopeHint(nextHint);
      setScopeResetKey((k) => k + 1);
    }

    function pickApp(option: StudyAppContentOption) {
      setSelectedAppKey(appContentOptionKey(option));
      setInlineAppKey("");
      setExternalLabel("");
      bumpScope(undefined);
      setPickerOpen(false);
      setErr("");
    }

    function handleInlineAppChange(key: string) {
      setInlineAppKey(key);
      setSelectedAppKey("");
      setExternalLabel("");
      bumpScope(undefined);
      setErr("");
    }

    function applyMaster(master: StudyItemMasterDoc) {
      setExternalLabel(master.name);
      clearAppSelection();
      bumpScope(master.defaultUnit);
      setErr("");
    }

    function handleClearApp() {
      clearAppSelection();
      bumpScope(undefined);
    }

    function resetRow() {
      setExternalLabel("");
      setScopeNote("");
      setScopeHint(undefined);
      setScopeResetKey((k) => k + 1);
      clearAppSelection();
      setErr("");
    }

    function buildDraft(): { item: StudyItemDraft | null; error?: string } {
      const note = scopeNote.trim();
      const label = externalLabel.trim();
      const hasApp = Boolean(selectedApp);
      const hasLabel = Boolean(label);
      const hasNote = Boolean(note);

      if (!hasApp && !hasLabel && !hasNote) {
        return { item: null };
      }

      const scopeErr = validateScopeNoteText(note, {
        required: hasApp,
      });
      if (scopeErr) {
        return { item: null, error: scopeErr };
      }

      if (selectedApp) {
        return {
          item: {
            source: "app",
            label: selectedApp.content.title,
            scopeNote: note,
            contentRef: contentToRef(selectedApp),
          },
        };
      }

      if (!label) {
        return {
          item: null,
          error: "教材名を入力するか、アプリの教材を選んでください。",
        };
      }

      return {
        item: {
          source: "external",
          label,
          scopeNote: note,
        },
      };
    }

    useImperativeHandle(ref, () => ({
      consumePending: () => {
        const result = buildDraft();
        if (result.item) {
          resetRow();
        }
        return result;
      },
    }));

    function submit() {
      const result = buildDraft();
      if (result.error) {
        setErr(result.error);
        return;
      }
      if (!result.item) {
        setErr("教材名を入力するか、アプリの教材を選んでください。");
        return;
      }
      onAdd(result.item);
      resetRow();
    }

    const datalistId = `study-master-datalist-${filterSubjectId || "all"}`;

    return (
      <div className="study-item-add-row">
        <p className="study-item-add-row__hint">
          学習内容を入力したら「リストに追加」を押します。複数ある場合は繰り返してください。最後に下の「保存する」で計画を登録します（入力したまま保存しても取り込まれます）。
        </p>

        {selectedApp ? (
          <div className="study-item-add-row__app-picked">
            <span className="study-item-add-row__app-badge">アプリの教材</span>
            <span className="study-item-add-row__app-title">{selectedApp.content.title}</span>
            <span className="study-item-add-row__app-meta">
              {selectedApp.workspaceName}
            </span>
            <button
              type="button"
              className="study-item-add-row__app-clear"
              onClick={handleClearApp}
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
                  よく使う教材名を登録すると次回から選べます →
                </Link>
              </p>
            )}

            {appOptions.length > 0 ? (
              <div className="study-item-add-row__app-pick">
                {useInlineAppPicker ? (
                  <label className="admin-field study-item-add-row__field">
                    <span className="admin-label">アプリの教材</span>
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
                    アプリの教材を選ぶ（{appOptions.length}件）
                  </button>
                )}
              </div>
            ) : null}
          </>
        )}

        <div className="study-item-add-row__bottom">
          <StudyScopeNoteInput
            key={`scope-${subjectId}-${scopeResetKey}`}
            className="study-item-add-row__scope"
            value={scopeNote}
            onChange={(next) => {
              setScopeNote(next);
              setErr("");
            }}
            preferredFormat={preferredFormat}
            unitHint={selectedApp ? undefined : scopeHint}
          />
          <button
            type="button"
            className="admin-btn admin-btn--primary study-item-add-row__submit"
            onClick={submit}
          >
            リストに追加
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
  },
);

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
