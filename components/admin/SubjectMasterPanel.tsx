"use client";

import { FormEvent, useState } from "react";
import { isDefaultSubjectId } from "@/lib/content/subject-defaults";
import { SLUG_PATTERN } from "@/lib/content/types";

export type SubjectMasterRow = {
  id: string;
  name: string;
  order: number;
  enabledInForm?: boolean;
};

type SubjectMasterPanelProps = {
  subjects: SubjectMasterRow[];
  contentCountBySubject?: Map<string, number>;
  busy: boolean;
  onCreate: (input: { id: string; name: string; order: number }) => Promise<void>;
  onUpdate: (
    id: string,
    patch: { name?: string; order?: number; enabledInForm?: boolean },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function SubjectMasterPanel({
  subjects,
  contentCountBySubject,
  busy,
  onCreate,
  onUpdate,
  onDelete,
}: SubjectMasterPanelProps) {
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newOrder, setNewOrder] = useState(10);
  const [err, setErr] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const id = newId.trim().toLowerCase();
    if (!SLUG_PATTERN.test(id)) {
      setErr("教科 ID は英小文字・数字・ハイフンのみです。");
      return;
    }
    if (!newName.trim()) {
      setErr("教科名を入力してください。");
      return;
    }
    try {
      await onCreate({ id, name: newName.trim(), order: newOrder });
      setNewId("");
      setNewName("");
      setNewOrder(10);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "登録に失敗しました。");
    }
  }

  return (
    <>
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}

      <section className="admin-card">
        <h2>教科を追加</h2>
        <p className="admin-msg" style={{ marginTop: 0 }}>
          算数・社会・理科は初期登録済みです。国語や英語など、必要な教科を追加できます。
        </p>
        <form onSubmit={(e) => void handleCreate(e)}>
          <div className="admin-row">
            <div className="admin-field" style={{ flex: "1 1 8rem" }}>
              <label htmlFor="subjectId">教科 ID</label>
              <input
                id="subjectId"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="english"
                required
              />
            </div>
            <div className="admin-field" style={{ flex: "1 1 10rem" }}>
              <label htmlFor="subjectName">教科名</label>
              <input
                id="subjectName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="英語"
                required
              />
            </div>
            <div className="admin-field" style={{ flex: "0 0 5rem" }}>
              <label htmlFor="subjectOrder">表示順</label>
              <input
                id="subjectOrder"
                type="number"
                min={1}
                value={newOrder}
                onChange={(e) => setNewOrder(Number(e.target.value))}
              />
            </div>
          </div>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
            追加
          </button>
        </form>
      </section>

      <section className="admin-card" style={{ marginTop: "1rem" }}>
        <h2>登録済み教科（{subjects.length}）</h2>
        <p className="admin-msg" style={{ marginTop: 0 }}>
          「コンテンツ作成に表示」をオフにすると、新規作成・編集時の教科プルダウンに出なくなります。
        </p>
        {subjects.length === 0 ? (
          <p className="admin-msg">教科がありません。</p>
        ) : (
          <ul className="admin-list">
            {subjects.map((s) => {
              const count = contentCountBySubject?.get(s.id) ?? 0;
              const isDefault = isDefaultSubjectId(s.id);
              return (
                <li key={s.id} className="admin-list-item" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ flex: "1 1 12rem" }}>
                    <strong>{s.name}</strong>
                    <br />
                    <code>{s.id}</code>
                    {count > 0 ? (
                      <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }}>
                        （教材 {count} 件）
                      </span>
                    ) : null}
                  </div>
                  <div className="admin-field" style={{ flex: "0 0 5rem", margin: 0 }}>
                    <label htmlFor={`order-${s.id}`}>順</label>
                    <input
                      id={`order-${s.id}`}
                      type="number"
                      min={1}
                      defaultValue={s.order}
                      disabled={busy}
                      onBlur={(e) => {
                        const order = Number(e.target.value);
                        if (!Number.isFinite(order) || order === s.order) return;
                        void onUpdate(s.id, { order });
                      }}
                    />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <input
                      type="checkbox"
                      checked={s.enabledInForm !== false}
                      disabled={busy}
                      onChange={(e) => void onUpdate(s.id, { enabledInForm: e.target.checked })}
                    />
                    コンテンツ作成に表示
                  </label>
                  {!isDefault ? (
                    <button
                      type="button"
                      className="admin-btn"
                      disabled={busy || count > 0}
                      title={count > 0 ? "教材がある教科は削除できません" : undefined}
                      onClick={() => {
                        if (!confirm(`「${s.name}」を削除しますか？`)) return;
                        void onDelete(s.id);
                      }}
                    >
                      削除
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "var(--admin-muted)" }}>初期教科</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
