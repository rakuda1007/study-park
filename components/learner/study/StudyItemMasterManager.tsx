"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createStudyItemMaster,
  deleteStudyItemMaster,
  listStudyItemMasters,
} from "@/lib/study/masters-firestore";
import { isCustomSubjectId, type StudySubjectOption } from "@/lib/study/subject-options";
import type { StudyItemMasterDoc } from "@/lib/study/types";

const ALL_SUBJECTS_ID = "";

type Props = {
  userId: string;
  subjects: StudySubjectOption[];
};

function subjectLabel(subjects: StudySubjectOption[], subjectId: string): string {
  if (!subjectId) return "すべての科目";
  return subjects.find((s) => s.id === subjectId)?.name ?? subjectId;
}

export function StudyItemMasterManager({ userId, subjects }: Props) {
  const [masters, setMasters] = useState<StudyItemMasterDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("");
  const [subjectId, setSubjectId] = useState(ALL_SUBJECTS_ID);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const data = await listStudyItemMasters(userId);
    setMasters(data);
  }, [userId]);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) {
      setErr("名称を入力してください。");
      return;
    }
    const picked = subjects.find((s) => s.id === subjectId);
    setSaving(true);
    try {
      await createStudyItemMaster(userId, {
        subjectId: subjectId === ALL_SUBJECTS_ID ? "" : subjectId,
        subjectName: picked?.name,
        name: name.trim(),
        defaultUnit: defaultUnit.trim() || undefined,
      });
      setName("");
      setDefaultUnit("");
      await refresh();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(master: StudyItemMasterDoc) {
    if (!window.confirm(`「${master.name}」を削除しますか？`)) return;
    await deleteStudyItemMaster(userId, master.id);
    await refresh();
  }

  const subjectOptions = subjects.filter((s) => !isCustomSubjectId(s.id));

  return (
    <div className="study-master-manager">
      <p className="admin-msg">
        よく使う外部教材（問題集・プリントなど）を登録しておくと、学習計画の追加が速くなります。
      </p>

      <form className="admin-card study-master-manager__form" onSubmit={(e) => void handleAdd(e)}>
        <h3 className="study-master-manager__title">項目を追加</h3>
        <label className="admin-field">
          <span className="admin-label">名称</span>
          <input
            className="admin-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 問題集、プリント、漢字ドリル"
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">対象範囲の単位（任意）</span>
          <input
            className="admin-input"
            value={defaultUnit}
            onChange={(e) => setDefaultUnit(e.target.value)}
            placeholder="例: ページ、問、第○単元"
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">科目</span>
          <select
            className="admin-input"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value={ALL_SUBJECTS_ID}>すべての科目</option>
            {subjectOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {err ? <p className="admin-err">{err}</p> : null}
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "追加中…" : "追加する"}
        </button>
      </form>

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading && masters.length === 0 ? (
        <section className="admin-card">
          <p>まだ登録がありません。上のフォームから追加してください。</p>
        </section>
      ) : null}

      {!loading && masters.length > 0 ? (
        <ul className="study-master-manager__list">
          {masters.map((master) => (
            <li key={master.id} className="study-master-manager__row admin-card">
              <div>
                <strong>{master.name}</strong>
                <p className="study-master-manager__meta">
                  {subjectLabel(subjects, master.subjectId)}
                  {master.defaultUnit ? ` ／ 単位: ${master.defaultUnit}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => void handleDelete(master)}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="study-master-manager__hint">
        登録した項目は{" "}
        <Link href="/learner/study/new" className="study-back-link">
          学習計画の追加
        </Link>
        画面の「その他の教材」から選べます。
      </p>
    </div>
  );
}
