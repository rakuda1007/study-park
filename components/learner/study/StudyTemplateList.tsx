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
};

export function StudyTemplateList({ userId, onApply, showApply = false }: Props) {
  const [templates, setTemplates] = useState<StudyTemplateDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await listStudyTemplates(userId);
    setTemplates(data);
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

  async function handleDelete(template: StudyTemplateDoc) {
    if (!window.confirm(`テンプレート「${template.name}」を削除しますか？`)) return;
    await deleteStudyTemplate(userId, template.id);
    await refresh();
  }

  if (loading) return <p className="admin-loading">読み込み中…</p>;

  if (templates.length === 0) {
    return (
      <section className="admin-card">
        <p>
          テンプレートはまだありません。学習計画の詳細画面から「テンプレートとして保存」できます。
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
                  {item.source === "app" ? "📱 " : "📚 "}
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
                このテンプレートを使う
              </button>
            ) : (
              <Link
                href={`/learner/study/new?templateId=${encodeURIComponent(template.id)}`}
                className="admin-btn admin-btn--primary"
              >
                計画を作成
              </Link>
            )}
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
