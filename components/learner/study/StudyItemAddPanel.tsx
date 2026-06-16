"use client";

import { useState } from "react";
import type { StudyContentRef, StudyItemDraft } from "@/lib/study/types";
import type { StudyWorkspaceOption } from "@/lib/study/subject-options";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";

type PickerMode = "choose" | "app" | "external";

type Props = {
  workspaces: StudyWorkspaceOption[];
  onAdd: (item: StudyItemDraft) => void;
};

function contentToRef(
  workspace: StudyWorkspaceOption,
  content: WorkspaceContentDoc,
): StudyContentRef {
  return {
    workspaceId: workspace.workspaceId,
    workspaceSlug: workspace.workspaceSlug,
    contentId: content.id,
    contentTitle: content.title,
    contentType: content.type,
    contentSlug: content.slug,
  };
}

export function StudyItemAddPanel({ workspaces, onAdd }: Props) {
  const [mode, setMode] = useState<PickerMode>("choose");
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.workspaceId ?? "");
  const [contentId, setContentId] = useState("");
  const [scopeNote, setScopeNote] = useState("");
  const [externalLabel, setExternalLabel] = useState("");
  const [externalScope, setExternalScope] = useState("");
  const [err, setErr] = useState("");

  const workspace = workspaces.find((w) => w.workspaceId === workspaceId);
  const contents = workspace?.contents ?? [];
  const selectedContent = contents.find((c) => c.id === contentId);

  function resetPicker() {
    setMode("choose");
    setScopeNote("");
    setExternalLabel("");
    setExternalScope("");
    setErr("");
  }

  function submitApp() {
    if (!workspace || !selectedContent) {
      setErr("教材を選んでください。");
      return;
    }
    if (!scopeNote.trim()) {
      setErr("対象範囲を入力してください。");
      return;
    }
    onAdd({
      source: "app",
      label: selectedContent.title,
      scopeNote: scopeNote.trim(),
      contentRef: contentToRef(workspace, selectedContent),
    });
    resetPicker();
  }

  function submitExternal() {
    if (!externalLabel.trim()) {
      setErr("名称を入力してください。");
      return;
    }
    onAdd({
      source: "external",
      label: externalLabel.trim(),
      scopeNote: externalScope.trim(),
    });
    resetPicker();
  }

  if (mode === "choose") {
    return (
      <div className="study-source-picker">
        <p className="study-source-picker__lead">学習内容をどう登録しますか？</p>
        <div className="study-source-picker__cards">
          <button
            type="button"
            className="study-source-picker__card"
            onClick={() => {
              if (workspaces.length === 0) {
                setErr("参加中の教材がありません。その他の教材から登録してください。");
                return;
              }
              setMode("app");
              setWorkspaceId(workspaces[0].workspaceId);
              setContentId(workspaces[0].contents[0]?.id ?? "");
              setErr("");
            }}
          >
            <span className="study-source-picker__icon" aria-hidden>
              📱
            </span>
            <span className="study-source-picker__title">Study Park の教材から</span>
            <span className="study-source-picker__desc">
              参加中の教材を選び、対象範囲を書きます
            </span>
          </button>
          <button
            type="button"
            className="study-source-picker__card"
            onClick={() => {
              setMode("external");
              setErr("");
            }}
          >
            <span className="study-source-picker__icon" aria-hidden>
              📚
            </span>
            <span className="study-source-picker__title">その他の教材</span>
            <span className="study-source-picker__desc">
              テキスト・問題集・プリントなどを自由に書きます
            </span>
          </button>
        </div>
        {err ? <p className="admin-err">{err}</p> : null}
      </div>
    );
  }

  if (mode === "app") {
    return (
      <div className="study-source-form admin-card">
        <h3 className="study-source-form__title">Study Park の教材</h3>
        {workspaces.length > 1 ? (
          <label className="admin-field">
            <span className="admin-label">教材のまとまり</span>
            <select
              className="admin-input"
              value={workspaceId}
              onChange={(e) => {
                const ws = workspaces.find((w) => w.workspaceId === e.target.value);
                setWorkspaceId(e.target.value);
                setContentId(ws?.contents[0]?.id ?? "");
              }}
            >
              {workspaces.map((w) => (
                <option key={w.workspaceId} value={w.workspaceId}>
                  {w.workspaceName}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="admin-field">
          <span className="admin-label">教材</span>
          <select
            className="admin-input"
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
          >
            {contents.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}（{c.type === "quiz" ? "クイズ" : "レッスン"}）
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span className="admin-label">対象範囲</span>
          <input
            className="admin-input"
            value={scopeNote}
            onChange={(e) => setScopeNote(e.target.value)}
            placeholder="例: 全問、第1章、問1-10"
          />
        </label>
        {err ? <p className="admin-err">{err}</p> : null}
        <div className="study-source-form__actions">
          <button type="button" className="admin-btn" onClick={resetPicker}>
            戻る
          </button>
          <button type="button" className="admin-btn admin-btn--primary" onClick={submitApp}>
            追加
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-source-form admin-card">
      <h3 className="study-source-form__title">その他の教材</h3>
      <label className="admin-field">
        <span className="admin-label">名称</span>
        <input
          className="admin-input"
          value={externalLabel}
          onChange={(e) => setExternalLabel(e.target.value)}
          placeholder="例: 問題集、プリント、漢字ドリル"
        />
      </label>
      <label className="admin-field">
        <span className="admin-label">対象範囲</span>
        <input
          className="admin-input"
          value={externalScope}
          onChange={(e) => setExternalScope(e.target.value)}
          placeholder="例: p.12-20、第3単元"
        />
      </label>
      {err ? <p className="admin-err">{err}</p> : null}
      <div className="study-source-form__actions">
        <button type="button" className="admin-btn" onClick={resetPicker}>
          戻る
        </button>
        <button type="button" className="admin-btn admin-btn--primary" onClick={submitExternal}>
          追加
        </button>
      </div>
    </div>
  );
}
