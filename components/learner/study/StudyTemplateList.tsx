"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  deleteStudyTemplate,
  listStudyTemplates,
} from "@/lib/study/templates-firestore";
import type { StudyTemplateDoc } from "@/lib/study/types";
import { StudyReadableText } from "./StudyReadableText";

type Props = {
  userId: string;
  onApply?: (template: StudyTemplateDoc) => void;
  showApply?: boolean;
  /** false のとき「計画を作成」リンクを出さない（計画追加画面への埋め込み用） */
  showCreateLink?: boolean;
  /** 一覧が変わったとき（削除後など）。親のピッカー選択肢の同期用 */
  onChanged?: (templates: StudyTemplateDoc[]) => void;
};

export function StudyTemplateList({
  userId,
  onApply,
  showApply = false,
  showCreateLink = true,
  onChanged,
}: Props) {
  const [templates, setTemplates] = useState<StudyTemplateDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await listStudyTemplates(userId);
    setTemplates(data);
    onChanged?.(data);
  }, [userId, onChanged]);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  async function handleDelete(template: StudyTemplateDoc) {
    if (!window.confirm(`計画テンプレ「${template.name}」を削除しますか？`)) return;
    await deleteStudyTemplate(userId, template.id);
    await refresh();
  }

  if (loading) return <p className="admin-loading">読み込み中…</p>;

  if (templates.length === 0) {
    return (
      <section className="admin-card">
        <p>
          計画テンプレはまだありません。計画の「記録する」画面から「計画テンプレに残す」ができます。
        </p>
      </section>
    );
  }

  return (
    <ul className="study-template-list">
      {templates.map((template) => (
        <li key={template.id} className="study-template-list__row admin-card">
          <div className="study-template-list__body">
            <strong className="study-template-list__name">{template.name}</strong>
            <p className="study-template-list__meta">
              {template.subjectName} ／ {template.durationDays}日間 ／ 学習内容{" "}
              {template.items.length}件
            </p>
            {template.memo ? (
              <p className="study-template-list__memo">{template.memo}</p>
            ) : null}
            <ul className="study-template-list__items">
              {template.items.map((item, index) => (
                <li key={`${template.id}-${index}`}>
                  <span
                    className={
                      item.source === "app"
                        ? "study-plan-card__app-badge"
                        : "study-template-list__source-badge"
                    }
                    title={item.source === "app" ? "アプリの教材" : "アプリ外の勉強"}
                  >
                    {item.source === "app" ? "アプリ" : "アプリ外"}
                  </span>{" "}
                  <StudyReadableText text={item.label} />
                  {item.scopeNote ? (
                    <>
                      （<StudyReadableText text={item.scopeNote} />）
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div className="study-template-list__actions">
            {showApply && onApply ? (
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => onApply(template)}
              >
                この計画テンプレを使う
              </button>
            ) : showCreateLink ? (
              <Link
                href={`/learner/study/new?templateId=${encodeURIComponent(template.id)}`}
                className="admin-btn admin-btn--primary"
              >
                計画を作成
              </Link>
            ) : null}
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={() => void handleDelete(template)}
            >
              削除
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
